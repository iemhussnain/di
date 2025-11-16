/**
 * Individual Journal Entry API Routes
 * Handles single journal entry operations (get, update, delete)
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import JournalEntry from '@/lib/models/JournalEntry'
import { updateJournalEntrySchema, journalEntryIdSchema } from '@/lib/validation/journalEntry'

/**
 * GET /api/journal-entries/[id]
 * Get a single journal entry by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate journal entry ID
    journalEntryIdSchema.parse(id)

    const entry = await JournalEntry.findById(id)
      .populate('created_by', 'name email')
      .populate('posted_by', 'name email')
      .populate('lines.account_id', 'account_code account_name account_type normal_balance')
      .populate('reversed_entry_id', 'entry_no entry_date description')
      .lean()

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: entry,
    })
  } catch (error) {
    console.error('GET /api/journal-entries/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid journal entry ID' },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid journal entry ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch journal entry' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/journal-entries/[id]
 * Update a journal entry by ID (only if not posted)
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const { id } = params
    const body = await request.json()

    // Validate journal entry ID
    journalEntryIdSchema.parse(id)

    // Validate request body
    const validatedData = updateJournalEntrySchema.parse(body)

    // Check if journal entry exists
    const entry = await JournalEntry.findById(id)

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Check if entry is posted
    if (entry.posted) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify a posted journal entry' },
        { status: 400 }
      )
    }

    // Update journal entry
    const updatedEntry = await JournalEntry.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
      .populate('created_by', 'name email')
      .populate('lines.account_id', 'account_code account_name normal_balance')

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Journal entry updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/journal-entries/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid journal entry ID format' },
        { status: 400 }
      )
    }

    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update journal entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/journal-entries/[id]
 * Delete a journal entry by ID (only if not posted)
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate journal entry ID
    journalEntryIdSchema.parse(id)

    // Check if journal entry exists
    const entry = await JournalEntry.findById(id)

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Check if entry is posted
    if (entry.posted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete a posted journal entry. Please reverse it instead.',
        },
        { status: 400 }
      )
    }

    // Delete the entry
    await entry.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Journal entry deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/journal-entries/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid journal entry ID' },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid journal entry ID format' },
        { status: 400 }
      )
    }

    if (error.message) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete journal entry' },
      { status: 500 }
    )
  }
}
