import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true }, // Unique browser identifier
    isAuthorized: { type: Boolean, default: false }, // true agar user logged in hai
    userEmail: { type: String, default: null }, // Logged-in user ka email
    userName: { type: String, default: null },
    page: { type: String, default: "/" }, // User kis page par aaya
  },
  { timestamps: true }
);

export default mongoose.models.Visit || mongoose.model("Visit", VisitSchema);