/**
 * FBR Invoice Submission API
 * Submits invoice to FBR and creates FBR invoice record
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getCurrentUserId } from '@/lib/utils/session'
import User from '@/lib/models/User'
import FBRInvoice from '@/lib/models/fbr/FBRInvoice'
import FBRService from '@/lib/services/fbrService'

export async function POST(request) {
  try {
    await dbConnect()

    // Get current user ID
    const userId = await getCurrentUserId()

    // Get user with FBR tokens
    const user = await User.findById(userId).select('+fbr_sandbox_token +fbr_production_token')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get invoice data and environment from request
    const { environment = 'sandbox', ...invoiceData } = await request.json()

    // Determine which token to use
    const token = environment === 'production'
      ? user.fbr_production_token
      : user.fbr_sandbox_token

    if (!token) {
      return NextResponse.json(
        { error: `FBR ${environment} token not configured. Please update your settings.` },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!invoiceData.invoiceType) {
      return NextResponse.json(
        { error: 'Invoice type is required' },
        { status: 400 }
      )
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Step 1: Validate invoice first
    const validationResult = environment === 'production'
      ? await FBRService.validateInvoiceProduction(token, invoiceData)
      : await FBRService.validateInvoiceSandbox(token, invoiceData)

    const isValid = validationResult.status === 'Valid' || validationResult.isValid === true

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice validation failed',
          message: validationResult.message || 'Invalid invoice data',
          validationErrors: validationResult.errors || validationResult.data
        },
        { status: 400 }
      )
    }

    // Step 2: Submit invoice to FBR
    const submissionResult = environment === 'production'
      ? await FBRService.postInvoiceProduction(token, invoiceData)
      : await FBRService.postInvoiceSandbox(token, invoiceData)

    // Extract FBR invoice number from response
    const fbrInvoiceNumber = submissionResult.invoiceNumber ||
                            submissionResult.fbrInvoiceNumber ||
                            submissionResult.data?.invoiceNumber

    if (!fbrInvoiceNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get FBR invoice number',
          message: 'Invoice submitted but no invoice number returned',
          data: submissionResult
        },
        { status: 500 }
      )
    }

    // Step 3: Create FBR Invoice record
    const fbrInvoice = await FBRInvoice.create({
      // User reference
      created_by: userId,

      // Invoice type
      invoiceType: invoiceData.invoiceType,
      invoiceDate: invoiceData.invoiceDate,

      // Seller information
      sellerNTNCNIC: invoiceData.sellerNTNCNIC || user.company_ntn,
      sellerBusinessName: invoiceData.sellerBusinessName || user.name,
      sellerProvince: invoiceData.sellerProvince || user.company_province,
      sellerAddress: invoiceData.sellerAddress || user.company_address,

      // Buyer information
      buyerNTNCNIC: invoiceData.buyerNTNCNIC,
      buyerBusinessName: invoiceData.buyerBusinessName,
      buyerProvince: invoiceData.buyerProvince,
      buyerAddress: invoiceData.buyerAddress,
      buyerRegistrationType: invoiceData.buyerRegistrationType,

      // Invoice reference (for debit notes)
      invoiceRefNo: invoiceData.invoiceRefNo || '',

      // Items
      items: invoiceData.items.map(item => ({
        hsCode: item.hsCode,
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uoM,
        quantity: item.quantity,
        totalValues: item.totalValues,
        valueSalesExcludingST: item.valueSalesExcludingST,
        fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice || 0,
        salesTaxApplicable: item.salesTaxApplicable,
        salesTaxWithheldAtSource: item.salesTaxWithheldAtSource || 0,
        extraTax: item.extraTax || 0,
        furtherTax: item.furtherTax || 0,
        sroScheduleNo: item.sroScheduleNo || '',
        fedPayable: item.fedPayable || 0,
        discount: item.discount || 0,
        saleType: item.saleType,
        sroItemSerialNo: item.sroItemSerialNo || ''
      })),

      // FBR Response
      fbrInvoiceNumber,
      status: 'Valid',
      isLocked: true,

      // Environment
      environment,

      // Full FBR response
      fbrResponse: submissionResult
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice submitted successfully to FBR',
      invoiceNumber: fbrInvoiceNumber,
      fbrInvoiceId: fbrInvoice._id,
      data: submissionResult
    })

  } catch (error) {
    console.error('FBR submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit invoice to FBR' },
      { status: 500 }
    )
  }
}
