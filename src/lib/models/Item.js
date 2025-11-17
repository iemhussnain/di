/**
 * Item Model
 * Product/Item Master with dual stock tracking (registered/unregistered)
 */

import mongoose from 'mongoose'

const ItemSchema = new mongoose.Schema(
  {
    item_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    item_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    unit_of_measure: {
      type: String,
      required: true,
      enum: ['Pcs', 'Kg', 'Liter', 'Meter', 'Box', 'Dozen', 'Carton', 'Pack'],
      default: 'Pcs',
    },

    // Dual Stock Tracking
    registered_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    unregistered_qty: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Cost Tracking (Weighted Average)
    cost_registered: {
      type: Number,
      default: 0,
      min: 0,
    },
    cost_unregistered: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Selling Price
    selling_price: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Stock Control
    reorder_level: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorder_qty: {
      type: Number,
      default: 0,
      min: 0,
    },

    // FBR Integration
    hs_code: {
      type: String,
      trim: true,
    },
    tax_rate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },

    // Status
    is_active: {
      type: Boolean,
      default: true,
    },

    // Images
    image_url: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better query performance
ItemSchema.index({ item_name: 'text', item_code: 'text', description: 'text' })
ItemSchema.index({ category_id: 1, is_active: 1 })
ItemSchema.index({ is_active: 1 })

// Virtual: Total Quantity
ItemSchema.virtual('total_qty').get(function () {
  return this.registered_qty + this.unregistered_qty
})

// Virtual: Current Stock (alias for total_qty for backward compatibility)
ItemSchema.virtual('current_stock').get(function () {
  return this.total_qty
})

// Virtual: Total Value
ItemSchema.virtual('total_value').get(function () {
  return this.registered_qty * this.cost_registered + this.unregistered_qty * this.cost_unregistered
})

// Virtual: Is Low Stock
ItemSchema.virtual('is_low_stock').get(function () {
  return this.total_qty <= this.reorder_level
})

// Virtual: Profit Margin
ItemSchema.virtual('profit_margin').get(function () {
  const avgCost =
    this.total_qty > 0
      ? (this.registered_qty * this.cost_registered +
          this.unregistered_qty * this.cost_unregistered) /
        this.total_qty
      : 0

  if (avgCost === 0) return 0
  return ((this.selling_price - avgCost) / this.selling_price) * 100
})

// Static method to get low stock items
ItemSchema.statics.getLowStockItems = async function () {
  const items = await this.find({ is_active: true }).populate('category_id', 'category_name')

  return items.filter((item) => item.is_low_stock)
}

// Static method to search items
ItemSchema.statics.searchItems = async function (query) {
  return this.find({
    $text: { $search: query },
    is_active: true,
  })
    .populate('category_id', 'category_name')
    .limit(20)
}

// Method to update stock (used by stock movement module)
ItemSchema.methods.updateStock = async function (
  qtyChange,
  costChange,
  isRegistered = true,
  isIncrease = true
) {
  if (isRegistered) {
    if (isIncrease) {
      // Weighted average cost calculation for increase
      const newQty = this.registered_qty + qtyChange
      if (newQty > 0) {
        this.cost_registered =
          (this.registered_qty * this.cost_registered + qtyChange * costChange) / newQty
      }
      this.registered_qty = newQty
    } else {
      // Decrease doesn't affect cost
      this.registered_qty = Math.max(0, this.registered_qty - qtyChange)
    }
  } else {
    if (isIncrease) {
      // Weighted average cost calculation for increase
      const newQty = this.unregistered_qty + qtyChange
      if (newQty > 0) {
        this.cost_unregistered =
          (this.unregistered_qty * this.cost_unregistered + qtyChange * costChange) / newQty
      }
      this.unregistered_qty = newQty
    } else {
      // Decrease doesn't affect cost
      this.unregistered_qty = Math.max(0, this.unregistered_qty - qtyChange)
    }
  }

  return this.save()
}

export default mongoose.models.Item || mongoose.model('Item', ItemSchema)
