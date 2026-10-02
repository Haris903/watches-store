import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Watch from "@/models/Watch";
import User from "@/models/User";

export async function PATCH(req) {
  try {
    await dbConnect();

    const { id, stock } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Watch ID is required." },
        { status: 400 }
      );
    }

    const validStock = Math.max(0, parseInt(stock, 10) || 0);

    // 1. Asal Watch collection mein stock update
    const updatedWatch = await Watch.findByIdAndUpdate(
      id,
      { stock: validStock },
      { new: true }
    );

    // 🟢 2. Agar stock 0 ho jaye, toh sab ke cart se DELETE karein
    if (validStock <= 0) {
      await User.updateMany(
        {},
        {
          $pull: {
            cart: {
              $or: [
                { id: String(id) },
                { _id: String(id) },
                { id: id },
                { _id: id },
              ],
            },
          },
        }
      );
    } else {
      // 🟢 3. Agar stock 1 ya zyada ho, toh cart ke andar mojood item ka stock bhi SYNC karein
      await User.updateMany(
        {
          $or: [
            { "cart.id": String(id) },
            { "cart._id": String(id) },
            { "cart.id": id },
            { "cart._id": id },
          ],
        },
        {
          $set: {
            "cart.$[elem].stock": validStock,
          },
        },
        {
          arrayFilters: [
            {
              $or: [
                { "elem.id": String(id) },
                { "elem._id": String(id) },
                { "elem.id": id },
                { "elem._id": id },
              ],
            },
          ],
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Stock synced globally in watches & user carts!",
      stock: updatedWatch.stock,
    });
  } catch (error) {
    console.error("Stock Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update stock." },
      { status: 500 }
    );
  }
}