/**
 * FBR Transaction Type Model
 * Caches transaction type data from FBR API
 */

import mongoose from 'mongoose'

const FBRTransTypeSchema = new mongoose.Schema(
  {
    transactioN_TYPE_ID: {
      type: Number,
      required: true,
      unique: true,
    },
    transactioN_DESC: {
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

FBRTransTypeSchema.index({ transactioN_TYPE_ID: 1 })

FBRTransTypeSchema.statics.isCacheStale = async function () {
  const count = await this.countDocuments()
  if (count === 0) return true

  const latestRecord = await this.findOne().sort({ lastFetched: -1 })
  if (!latestRecord) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return latestRecord.lastFetched < oneWeekAgo
}

FBRTransTypeSchema.statics.refreshCache = async function (data) {
  await this.deleteMany({})
  const records = data.map((item) => ({
    transactioN_TYPE_ID: item.transactioN_TYPE_ID,
    transactioN_DESC: item.transactioN_DESC,
    lastFetched: new Date(),
  }))
  return this.insertMany(records)
}

const FBRTransType = mongoose.models.FBRTransType || mongoose.model('FBRTransType', FBRTransTypeSchema)

export default FBRTransType
