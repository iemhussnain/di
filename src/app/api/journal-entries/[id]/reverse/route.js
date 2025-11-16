/**
 * Reverse Journal Entry API Route
 * Create a reversing journal entry
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { reverseJournalEntry } from '@/lib/accounting/journal'
import { journalEntryIdSchema, reverseJournalEntrySchema } from '@/lib/validation/journalEntry'

/**
 * POST /api/journal-entries/[id]/reverse
 * Create a reversing entry for a posted journal entry
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const { id } = params
    const body = await request.json()

    // Validate journal entry ID
    journalEntryIdSchema.parse(id)

    // Validate request body
    const { created_by, reversal_date } = reverseJournalEntrySchema.parse(body)

    // Create reversing entry
    const reversingEntry = await reverseJournalEntry(
      id,
      created_by,
      reversal_date ? new Date(reversal_date) : null
    )

    // Populate references for response
    await reversingEntry.populate([
      { path: 'created_by', select: 'name email' },
      { path: 'posted_by', select: 'name email' },
      { path: 'lines.account_id', select: 'account_code account_name' },
      { path: 'reversed_entry_id', select: 'entry_no entry_date description' },
    ])

    return NextResponse.json({
      success: true,
      data: reversingEntry,
      message: 'Reversing journal entry created and posted successfully',
    })
  } catch (error) {
    console.error('POST /api/journal-entries/[id]/reverse error:', error)

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
      { success: false, error: 'Failed to create reversing entry' },
      { status: 500 }
    )
  }
}
