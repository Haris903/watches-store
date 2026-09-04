import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },
    paymentMethod: { type: String, default: "NOT SELECTED" },
    watchTitle: { type: String, required: true },
    watchPrice: { type: String, required: true },
    screenshotName: { type: String, default: "" },
    screenshotUrl: { type: String, required: true }, // Base64 image receiver string
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);