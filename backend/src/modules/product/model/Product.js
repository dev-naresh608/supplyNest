import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    attributeName: { type: String, required: true }, // e.g. "Color", "Size"
    attributeValue: { type: String, required: true }, // e.g. "Red", "XL"
    priceOffset: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true, index: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: undefined,
      set: (v) => (v && typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined),
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    images: [{ type: String }],
    primaryImage: { type: String, default: "" },
    unit: { type: String, default: "Pcs" },
    weight: { type: Number, default: 0 },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    gstRate: { type: Number, default: 18 }, // GST percentage
    hsnCode: { type: String, default: "" },
    costPrice: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    mrp: { type: Number, required: true },

    variants: [variantSchema],

    status: {
      type: String,
      enum: [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "OUT_OF_STOCK",
        "ARCHIVED",
        "DELETED",
      ],
      default: "ACTIVE",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model("Product", productSchema);
