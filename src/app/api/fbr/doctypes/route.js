import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import FBRDocType from '@/lib/models/fbr/FBRDocType'
import FBRService from '@/lib/services/fbrService'
import User from '@/lib/models/User'
import { getCurrentUserId } from '@/lib/utils/session'

export async function GET(request) {
  try {
    await dbConnect()

    const isStale = await FBRDocType.isCacheStale()

    if (isStale) {
      const userId = await getCurrentUserId()
      const user = await User.findById(userId).select('+fbr_sandbox_token')

      if (!user?.fbr_sandbox_token) {
        return NextResponse.json(
          { error: 'FBR sandbox token not configured' },
          { status: 400 }
        )
      }

      const fbrData = await FBRService.fetchDocTypes(user.fbr_sandbox_token)
      await FBRDocType.refreshCache(fbrData)
    }

    const docTypes = await FBRDocType.find().sort({ docTypeId: 1 })

    return NextResponse.json({
      success: true,
      data: docTypes,
      cached: !isStale,
    })
  } catch (error) {
    console.error('FBR DocTypes API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch document types' },
      { status: 500 }
    )
  }
}
