/**
 * FBR Unit of Measurement Model
 * Caches UOM data from FBR API
 */

import mongoose from 'mongoose'

const FBRUOMSchema = new mongoose.Schema(
  {
    uoM_ID: {
      type: Number,
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

FBRUOMSchema.index({ uoM_ID: 1 })

FBRUOMSchema.statics.isCacheStale = async function () {
  const count = await this.countDocuments()
  if (count === 0) return true

  const latestRecord = await this.findOne().sort({ lastFetched: -1 })
  if (!latestRecord) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return latestRecord.lastFetched < oneWeekAgo
}

FBRUOMSchema.statics.refreshCache = async function (data) {
  await this.deleteMany({})
  const records = data.map((item) => ({
    uoM_ID: item.uoM_ID,
    description: item.description,
    lastFetched: new Date(),
  }))
  return this.insertMany(records)
}

const FBRUOM = mongoose.models.FBRUOM || mongoose.model('FBRUOM', FBRUOMSchema)

export default FBRUOM
