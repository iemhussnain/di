import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import FBRHSCode from '@/lib/models/fbr/FBRHSCode'
import FBRService from '@/lib/services/fbrService'
import User from '@/lib/models/User'
import { getCurrentUserId } from '@/lib/utils/session'

export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit')) || 50

    const isStale = await FBRHSCode.isCacheStale()

    if (isStale) {
      const userId = await getCurrentUserId()
      const user = await User.findById(userId).select('+fbr_sandbox_token')

      if (!user?.fbr_sandbox_token) {
        return NextResponse.json(
          { error: 'FBR sandbox token not configured' },
          { status: 400 }
        )
      }

      const fbrData = await FBRService.fetchHSCodes(user.fbr_sandbox_token)
      await FBRHSCode.refreshCache(fbrData)
    }

    let hsCodes
    if (search) {
      hsCodes = await FBRHSCode.searchByCodes(search, limit)
    } else {
      hsCodes = await FBRHSCode.find().limit(limit).sort({ hS_CODE: 1 })
    }

    return NextResponse.json({
      success: true,
      data: hsCodes,
      cached: !isStale,
    })
  } catch (error) {
    console.error('FBR HS Codes API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch HS codes' },
      { status: 500 }
    )
  }
}
