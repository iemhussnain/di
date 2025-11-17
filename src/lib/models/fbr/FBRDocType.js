/**
 * FBR Document Type Model
 * Caches document type data from FBR API
 */

import mongoose from 'mongoose'

const FBRDocTypeSchema = new mongoose.Schema(
  {
    docTypeId: {
      type: Number,
      required: true,
      unique: true,
    },
    docDescription: {
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

FBRDocTypeSchema.index({ docTypeId: 1 })

FBRDocTypeSchema.statics.isCacheStale = async function () {
  const count = await this.countDocuments()
  if (count === 0) return true

  const latestRecord = await this.findOne().sort({ lastFetched: -1 })
  if (!latestRecord) return true

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return latestRecord.lastFetched < oneWeekAgo
}

FBRDocTypeSchema.statics.refreshCache = async function (data) {
  await this.deleteMany({})
  const records = data.map((item) => ({
    docTypeId: item.docTypeId,
    docDescription: item.docDescription,
    lastFetched: new Date(),
  }))
  return this.insertMany(records)
}

const FBRDocType = mongoose.models.FBRDocType || mongoose.model('FBRDocType', FBRDocTypeSchema)

export default FBRDocType
