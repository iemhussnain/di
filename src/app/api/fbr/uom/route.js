import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import FBRUOM from '@/lib/models/fbr/FBRUOM'
import FBRService from '@/lib/services/fbrService'
import User from '@/lib/models/User'
import { getCurrentUserId } from '@/lib/utils/session'

export async function GET(request) {
  try {
    await dbConnect()

    const isStale = await FBRUOM.isCacheStale()

    if (isStale) {
      const userId = await getCurrentUserId()
      const user = await User.findById(userId).select('+fbr_sandbox_token')

      if (!user?.fbr_sandbox_token) {
        return NextResponse.json(
          { error: 'FBR sandbox token not configured' },
          { status: 400 }
        )
      }

      const fbrData = await FBRService.fetchUOM(user.fbr_sandbox_token)
      await FBRUOM.refreshCache(fbrData)
    }

    const uoms = await FBRUOM.find().sort({ uoM_ID: 1 })

    return NextResponse.json({
      success: true,
      data: uoms,
      cached: !isStale,
    })
  } catch (error) {
    console.error('FBR UOM API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch units of measurement' },
      { status: 500 }
    )
  }
}
