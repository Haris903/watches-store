import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Order from "@/models/Order";

// GET: All Customer Orders
export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Update Order Status (Pending -> Verified -> Dispatched -> Delivered)
export async function PATCH(req) {
  try {
    await dbConnect();
    const { orderId, status } = await req.json();
    const updated = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 🟢 DELETE: Delete Order by ID
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID zaroori hai." },
        { status: 400 }
      );
    }

    await Order.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Order delete ho gaya." });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}