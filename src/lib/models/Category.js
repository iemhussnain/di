/**
 * Category Model
 * Product/Item Categories
 */

import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
CategorySchema.index({ category_name: 1 })
CategorySchema.index({ parent_id: 1 })
CategorySchema.index({ is_active: 1 })

// Pre-save middleware to calculate level
CategorySchema.pre('save', async function (next) {
  if (this.parent_id) {
    const parent = await mongoose.model('Category').findById(this.parent_id)
    if (parent) {
      this.level = parent.level + 1
    }
  } else {
    this.level = 0
  }
  next()
})

// Method to get all children
CategorySchema.methods.getChildren = async function () {
  return mongoose.model('Category').find({ parent_id: this._id })
}

// Static method to build category tree
CategorySchema.statics.buildTree = async function (parentId = null) {
  const categories = await this.find({ parent_id: parentId, is_active: true }).sort({
    category_name: 1,
  })

  const tree = []
  for (const category of categories) {
    const node = category.toObject()
    node.children = await this.buildTree(category._id)
    tree.push(node)
  }

  return tree
}

// Prevent deletion if category has children or items
CategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const children = await this.getChildren()
  if (children.length > 0) {
    throw new Error('Cannot delete category with subcategories')
  }

  // Check for items (will be implemented when Item model is created)
  const Item = mongoose.models.Item
  if (Item) {
    const items = await Item.countDocuments({ category_id: this._id })
    if (items > 0) {
      throw new Error('Cannot delete category with existing items')
    }
  }

  next()
})

export default mongoose.models.Category || mongoose.model('Category', CategorySchema)
