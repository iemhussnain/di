/**
 * FBR Invoice Model
 * Stores FBR invoice submissions and responses
 */

import mongoose from 'mongoose'

const FBRInvoiceItemSchema = new mongoose.Schema({
  hsCode: String,
  productDescription: String,
  rate: String,
  uoM: String,
  quantity: Number,
  totalValues: Number,
  valueSalesExcludingST: Number,
  fixedNotifiedValueOrRetailPrice: Number,
  salesTaxApplicable: Number,
  salesTaxWithheldAtSource: Number,
  extraTax: Number,
  furtherTax: Number,
  sroScheduleNo: String,
  fedPayable: Number,
  discount: Number,
  saleType: String,
  sroItemSerialNo: String,
})

const FBRInvoiceSchema = new mongoose.Schema(
  {
    // Reference to internal invoice
    sales_invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesInvoice',
    },
    
    // FBR Invoice Data
    invoiceType: {
      type: String,
      required: true,
      enum: ['Sale Invoice', 'Debit Note'],
    },
    invoiceDate: {
      type: String,
      required: true,
    },
    
    // Seller Information
    sellerNTNCNIC: {
      type: String,
      required: true,
    },
    sellerBusinessName: {
      type: String,
      required: true,
    },
    sellerProvince: {
      type: String,
      required: true,
    },
    sellerAddress: {
      type: String,
      required: true,
    },
    
    // Buyer Information
    buyerNTNCNIC: {
      type: String,
      required: true,
    },
    buyerBusinessName: {
      type: String,
      required: true,
    },
    buyerProvince: {
      type: String,
      required: true,
    },
    buyerAddress: {
      type: String,
      required: true,
    },
    buyerRegistrationType: {
      type: String,
      required: true,
      enum: ['Registered', 'Unregistered'],
    },
    
    // Reference for Debit Notes
    invoiceRefNo: String,
    
    // Invoice Items
    items: [FBRInvoiceItemSchema],
    
    // FBR Response
    fbrInvoiceNumber: String, // FBR generated invoice number
    fbrInvoiceNumbers: [String], // For multiple items (e.g., 7000007DI1747119701593-1)
    statusCode: String,
    status: {
      type: String,
      enum: ['Pending', 'Valid', 'Invalid', 'Error'],
      default: 'Pending',
    },
    errorCode: String,
    error: String,
    invoiceStatuses: mongoose.Schema.Types.Mixed, // Array of item statuses
    
    // Metadata
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    submittedAt: Date,
    respondedAt: Date,
    isLocked: {
      type: Boolean,
      default: false,
    },
    scenarioId: String, // For testing scenarios
  },
  {
    timestamps: true,
  }
)

// Indexes
FBRInvoiceSchema.index({ sales_invoice_id: 1 })
FBRInvoiceSchema.index({ fbrInvoiceNumber: 1 })
FBRInvoiceSchema.index({ status: 1 })
FBRInvoiceSchema.index({ environment: 1 })

// Lock invoice when FBR number is received
FBRInvoiceSchema.methods.lockInvoice = function () {
  this.isLocked = true
  return this.save()
}

const FBRInvoice = mongoose.models.FBRInvoice || mongoose.model('FBRInvoice', FBRInvoiceSchema)

export default FBRInvoice
