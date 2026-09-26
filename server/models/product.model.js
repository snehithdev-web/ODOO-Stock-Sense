import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide product SKU / Code'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
    },
    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please specify initial quantity'],
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      default: 'Main Warehouse',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
