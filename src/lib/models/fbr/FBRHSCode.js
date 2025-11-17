/**
 * FBR HS Code Model
 * Caches HS Code (Item Code) data from FBR API
 */

import mongoose from 'mongoose'

const FBRHSCodeSchema = new mongoose.Schema(
  {
    hS_CODE: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
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

FBRHSCodeSchema.index({ hS_CODE: 1 })
FBRHSCodeSchema.index({ description: 'text' })

FBRHSCodeSchema.statics.isCacheStale = async function () {
  const count = await this.countDocuments()
  if (count === 0) return true

  const latestRecord = await this.findOne().sort({ lastFetched: -1 })
  if (!latestRecord) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return latestRecord.lastFetched < oneWeekAgo
}

FBRHSCodeSchema.statics.refreshCache = async function (data) {
  await this.deleteMany({})
  const records = data.map((item) => ({
    hS_CODE: item.hS_CODE,
    description: item.description,
    lastFetched: new Date(),
  }))
  return this.insertMany(records)
}

// Search HS codes by keyword
FBRHSCodeSchema.statics.searchByCodes = function (query, limit = 50) {
  return this.find({
    $or: [
      { hS_CODE: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') },
    ],
  })
    .limit(limit)
    .sort({ hS_CODE: 1 })
}

const FBRHSCode = mongoose.models.FBRHSCode || mongoose.model('FBRHSCode', FBRHSCodeSchema)

export default FBRHSCode
