/* eslint-disable @typescript-eslint/no-explicit-any */
// src/models/food.model.ts
import mongoose, { Schema, Model } from "mongoose";
import { IFoodDocument } from "@/src/interfaces/food.interfaces";

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, default: "" }, // no longer required — some providers may not return it
  },
  { _id: false },
);

const variationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, required: true, trim: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },

    images: {
      type: [imageSchema],
      validate: {
        validator: (arr: unknown[]) =>
          Array.isArray(arr) &&
          arr.length >= 1 &&
          arr.length <= 3 &&
          arr.every((img: any) => !!img?.url),
        message:
          "At least 1 and at most 3 images (each with a url) are required per variation",
      },
      required: true,
    },

    discountType: {
      type: String,
      enum: ["none", "percentage", "flat"],
      default: "none",
    },
    discountValue: { type: Number, default: 0, min: 0 },
    metalType: { type: String, trim: true, default: "" },
    metalPurity: { type: String, trim: true, default: "" },
    gemstoneType: { type: String, trim: true, default: "" },
    gemstoneColor: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    weight: { type: Number, min: 0 },
    gender: {
      type: String,
      enum: ["", "Women", "Men", "Unisex", "Kids"],
      default: "Unisex",
    },
    material: { type: String, trim: true, default: "" },
    isAvailable: { type: Boolean, default: true },
    stock_quantity: { type: Number, min: 0 },
    is_default: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

const foodSchema = new Schema<IFoodDocument>(
  {
    name: { type: String, required: true, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: "Category" },
    category_name: { type: String, trim: true, default: "" },
    description: { type: String, default: "" },
    // নতুন খাবার শূন্য থেকে শুরু করে — ভিউ বাড়ে ভিজিটে, রেটিং বসে রিভিউ থেকে
    view: { type: Number, default: 0, min: 0 },
    total_review: { type: Number, default: 0, min: 0 },
    review_rating: { type: Number, default: 0, min: 0, max: 5 },
    branch_id: { type: String, trim: true, default: "" },
    branch_name: { type: String, trim: true, default: "" },

    image: { type: String, default: "" },
    image_public_id: { type: String, default: "" },

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    variations: {
      type: [variationSchema],
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length >= 1,
        message: "At least one variation is required",
      },
      required: true,
    },
  },
  { timestamps: true },
);

foodSchema.index({ name: "text" });
foodSchema.index({ category_id: 1 });
foodSchema.index({ "variations.sku": 1 }, { unique: true, sparse: true });
foodSchema.index({ "variations.barcode": 1 }, { unique: true, sparse: true });

const FoodModel: Model<IFoodDocument> =
  (mongoose.models.Food as Model<IFoodDocument>) ||
  mongoose.model<IFoodDocument>("Food", foodSchema);

export default FoodModel;
