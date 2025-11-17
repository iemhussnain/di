/**
 * FBR Province Model
 * Caches province data from FBR API
 */

import mongoose from 'mongoose'

const FBRProvinceSchema = new mongoose.Schema(
  {
    stateProvinceCode: {
      type: Number,
      required: true,
      unique: true,
    },
    stateProvinceDesc: {
      type: String,
      required: true,
    },
    lastFetched: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Index for fast lookups
FBRProvinceSchema.index({ stateProvinceCode: 1 })

// Static method: Check if cache is stale (older than 1 week)
FBRProvinceSchema.statics.isCacheStale = async function () {
  const count = await this.countDocuments()
  if (count === 0) return true

  const latestRecord = await this.findOne().sort({ lastFetched: -1 })
  if (!latestRecord) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return latestRecord.lastFetched < oneWeekAgo
}

// Static method: Refresh cache with new data
FBRProvinceSchema.statics.refreshCache = async function (data) {
  await this.deleteMany({})
  const records = data.map((item) => ({
    stateProvinceCode: item.stateProvinceCode,
    stateProvinceDesc: item.stateProvinceDesc,
    lastFetched: new Date(),
  }))
  return this.insertMany(records)
}

const FBRProvince = mongoose.models.FBRProvince || mongoose.model('FBRProvince', FBRProvinceSchema)

export default FBRProvince
