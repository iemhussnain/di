import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import FBRProvince from '@/lib/models/fbr/FBRProvince'
import FBRService from '@/lib/services/fbrService'
import User from '@/lib/models/User'
import { getCurrentUserId } from '@/lib/utils/session'

export async function GET(request) {
  try {
    await dbConnect()

    // Check if cache is stale
    const isStale = await FBRProvince.isCacheStale()

    if (isStale) {
      // Get user's FBR sandbox token
      const userId = await getCurrentUserId()
      const user = await User.findById(userId).select('+fbr_sandbox_token')

      if (!user?.fbr_sandbox_token) {
        return NextResponse.json(
          { error: 'FBR sandbox token not configured. Please update your settings.' },
          { status: 400 }
        )
      }

      // Fetch fresh data from FBR
      const fbrData = await FBRService.fetchProvinces(user.fbr_sandbox_token)

      // Refresh cache
      await FBRProvince.refreshCache(fbrData)
    }

    // Return cached data
    const provinces = await FBRProvince.find().sort({ stateProvinceCode: 1 })

    return NextResponse.json({
      success: true,
      data: provinces,
      cached: !isStale,
    })
  } catch (error) {
    console.error('FBR Provinces API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch provinces' },
      { status: 500 }
    )
  }
}
