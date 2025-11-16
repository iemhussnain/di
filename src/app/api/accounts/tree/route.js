/**
 * Account Tree API Route
 * GET /api/accounts/tree - Get account hierarchy tree
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Account from '@/lib/models/Account'

// GET /api/accounts/tree - Get account tree
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const accountType = searchParams.get('account_type')
    const activeOnly = searchParams.get('active_only') !== 'false' // Default true

    // Build filter
    const filter = {}
    if (accountType) {
      filter.account_type = accountType
    }
    if (activeOnly) {
      filter.is_active = true
    }

    // Get root accounts (accounts with no parent)
    const rootAccounts = await Account.find({
      ...filter,
      parent_id: null,
    }).sort({ account_code: 1 })

    // Build tree recursively
    const buildTree = async (parentId = null, currentFilter = {}) => {
      const accounts = await Account.find({
        ...currentFilter,
        parent_id: parentId,
      }).sort({ account_code: 1 })

      const tree = []
      for (const account of accounts) {
        const node = account.toObject()

        // Get children recursively
        const children = await buildTree(account._id, currentFilter)
        if (children.length > 0) {
          node.children = children
        }

        tree.push(node)
      }

      return tree
    }

    const tree = []
    for (const rootAccount of rootAccounts) {
      const node = rootAccount.toObject()

      // Get children recursively
      const children = await buildTree(rootAccount._id, filter)
      if (children.length > 0) {
        node.children = children
      }

      tree.push(node)
    }

    return NextResponse.json({
      success: true,
      data: tree,
    })
  } catch (error) {
    console.error('GET /api/accounts/tree error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch account tree',
      },
      { status: 500 }
    )
  }
}
