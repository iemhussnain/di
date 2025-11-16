/**
 * Post Journal Entry API Route
 * Post journal entry to ledger and update account balances
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { postJournalEntry, validateJournalEntry } from '@/lib/accounting/journal'
import { journalEntryIdSchema, postJournalEntrySchema } from '@/lib/validation/journalEntry'

/**
 * POST /api/journal-entries/[id]/post
 * Post a journal entry to the ledger
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const { id } = params
    const body = await request.json()

    // Validate journal entry ID
    journalEntryIdSchema.parse(id)

    // Validate request body
    const { posted_by } = postJournalEntrySchema.parse(body)

    // Validate the entry before posting
    const validation = await validateJournalEntry(id)

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Journal entry validation failed',
          validation_errors: validation.errors,
          validation_warnings: validation.warnings,
        },
        { status: 400 }
      )
    }

    // Post the entry
    const postedEntry = await postJournalEntry(id, posted_by)

    // Re-fetch with populated fields
    await postedEntry.populate([
      { path: 'created_by', select: 'name email' },
      { path: 'posted_by', select: 'name email' },
      { path: 'lines.account_id', select: 'account_code account_name current_balance' },
    ])

    return NextResponse.json({
      success: true,
      data: postedEntry,
      message: 'Journal entry posted successfully',
    })
  } catch (error) {
    console.error('POST /api/journal-entries/[id]/post error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to post journal entry' },
      { status: 500 }
    )
  }
}
