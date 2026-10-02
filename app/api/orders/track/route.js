import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Order from "@/models/Order";
import Watch from "@/models/Watch";

export async function POST(req) {
  try {
    await dbConnect();
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide an Order ID or Phone number." },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();
    // Clean phone number format
    let cleanPhone = cleanQuery.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "92" + cleanPhone.slice(1);

    // Extract Short ID (e.g. #ORD-3FA9B1 -> 3FA9B1)
    const rawShortId = cleanQuery.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const shortHex = rawShortId.replace(/^ORD/i, "");

    // 1. Search Order by Phone OR MongoDB ID match
    let orders = await Order.find({
      $or: [
        { phone: cleanPhone },
        { phone: cleanQuery },
        ...(cleanQuery.length === 24 ? [{ _id: cleanQuery }] : []),
      ],
    }).sort({ createdAt: -1 });

    // Agar Phone se na mile to Short ID match karein
    if (orders.length === 0 && shortHex.length >= 4) {
      const allOrders = await Order.find().sort({ createdAt: -1 }).limit(100);
      orders = allOrders.filter((ord) =>
        ord._id.toString().slice(-6).toUpperCase().includes(shortHex)
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "No order found matching your details." },
        { status: 404 }
      );
    }

    const targetOrder = orders[0];
    const shortId = targetOrder._id.toString().slice(-6).toUpperCase();
    const formattedOrderId = `#ORD-${shortId}`;

    // 2. Fetch images for items
    const enrichedItems = await Promise.all(
      (targetOrder.items || []).map(async (item) => {
        const watchId = item.id || item._id;
        let watchDoc = null;
        if (watchId) {
          try {
            watchDoc = await Watch.findById(watchId).select("image spec category");
          } catch (e) {}
        }
        return {
          id: watchId,
          title: item.title || targetOrder.watchTitle,
          price: item.price || targetOrder.watchPrice,
          quantity: item.quantity || 1,
          image: watchDoc?.image || "/wClassic.png",
          spec: watchDoc?.spec || "SWISS PRECISION MOVEMENT",
        };
      })
    );

    // Agar items array empty ho to fallback
    if (enrichedItems.length === 0) {
      enrichedItems.push({
        title: targetOrder.watchTitle,
        price: targetOrder.watchPrice,
        quantity: 1,
        image: "/wClassic.png",
        spec: "SWISS PRECISION MOVEMENT",
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: formattedOrderId,
        rawId: targetOrder._id,
        createdAt: targetOrder.createdAt,
        name: targetOrder.name,
        phone: targetOrder.phone,
        email: targetOrder.email,
        address: targetOrder.address,
        paymentMethod: targetOrder.paymentMethod,
        totalPrice: targetOrder.watchPrice,
        status: targetOrder.status || "Payment Verification",
        items: enrichedItems,
        screenshotUrl: targetOrder.screenshotUrl,
      },
    });
  } catch (error) {
    console.error("Tracking API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error occurred while tracking." },
      { status: 500 }
    );
  }
}