/**
 * Journal Entries API Routes
 * Handles journal entry listing and creation
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import JournalEntry from '@/lib/models/JournalEntry'
import { createJournalEntry } from '@/lib/accounting/journal'
import { createJournalEntrySchema, journalEntryQuerySchema } from '@/lib/validation/journalEntry'

/**
 * GET /api/journal-entries
 * List journal entries with pagination, search, and filters
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = journalEntryQuerySchema.parse(query)
    const { page, limit, search, entry_type, posted, start_date, end_date, sort_by, order } =
      validatedQuery

    // Build filter
    const filter = {}

    // Entry type filter
    if (entry_type && entry_type !== 'all') {
      filter.entry_type = entry_type
    }

    // Posted status filter
    if (posted && posted !== 'all') {
      filter.posted = posted === 'true'
    }

    // Date range filter
    if (start_date && end_date) {
      filter.entry_date = {
        $gte: new Date(start_date),
        $lte: new Date(end_date),
      }
    } else if (start_date) {
      filter.entry_date = { $gte: new Date(start_date) }
    } else if (end_date) {
      filter.entry_date = { $lte: new Date(end_date) }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { entry_no: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference_no: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort = { [sort_by]: order === 'asc' ? 1 : -1 }

    // Execute query
    const [entries, total] = await Promise.all([
      JournalEntry.find(filter)
        .populate('created_by', 'name email')
        .populate('posted_by', 'name email')
        .populate('lines.account_id', 'account_code account_name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      JournalEntry.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/journal-entries error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch journal entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/journal-entries
 * Create a new journal entry
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createJournalEntrySchema.parse(body)

    // Create journal entry using helper function
    const entry = await createJournalEntry(validatedData)

    // Populate references for response
    await entry.populate([
      { path: 'created_by', select: 'name email' },
      { path: 'lines.account_id', select: 'account_code account_name normal_balance' },
    ])

    return NextResponse.json(
      {
        success: true,
        data: entry,
        message: 'Journal entry created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/journal-entries error:', error)

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
      { success: false, error: 'Failed to create journal entry' },
      { status: 500 }
    )
  }
}
