import mongoose from "mongoose";

const WatchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    collectionName: { type: String, default: "featured" },
    category: { type: String, default: "freshdrop" },
    subCategory: { type: String, default: "Automatic" },
    spec: { type: String, default: "SWISS PRECISION MOVEMENT" },
    // 🟢 View Details Modal ka description:
    description: { 
      type: String, 
       default: "" 
    },
    image: { type: String, required: true },
    stock: { type: Number, default: 10 },
    tag: { type: String, default: "" },
    rating: { type: Number, default: 4.9 },
    reviews: { type: Number, default: 24 },
  },
  { timestamps: true }
);

export default mongoose.models.Watch || mongoose.model("Watch", WatchSchema);