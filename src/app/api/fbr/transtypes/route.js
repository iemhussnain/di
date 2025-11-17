import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import FBRTransType from '@/lib/models/fbr/FBRTransType'
import FBRService from '@/lib/services/fbrService'
import User from '@/lib/models/User'
import { getCurrentUserId } from '@/lib/utils/session'

export async function GET(request) {
  try {
    await dbConnect()

    const isStale = await FBRTransType.isCacheStale()

    if (isStale) {
      const userId = await getCurrentUserId()
      const user = await User.findById(userId).select('+fbr_sandbox_token')

      if (!user?.fbr_sandbox_token) {
        return NextResponse.json(
          { error: 'FBR sandbox token not configured' },
          { status: 400 }
        )
      }

      const fbrData = await FBRService.fetchTransTypes(user.fbr_sandbox_token)
      await FBRTransType.refreshCache(fbrData)
    }

    const transTypes = await FBRTransType.find().sort({ transactioN_TYPE_ID: 1 })

    return NextResponse.json({
      success: true,
      data: transTypes,
      cached: !isStale,
    })
  } catch (error) {
    console.error('FBR Transaction Types API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transaction types' },
      { status: 500 }
    )
  }
}
