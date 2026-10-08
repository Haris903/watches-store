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
    const digitsOnly = cleanQuery.replace(/\D/g, "");
    const isPhone = digitsOnly.length >= 10;

    // Extract Short ID (e.g. #ORD-3FA9B1 -> 3FA9B1)
    const rawClean = cleanQuery.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const shortHex = rawClean.replace(/^ORD/i, "");

    let orders = [];

    if (isPhone) {
      // 🟢 1. Phone number se search: Saare orders fetch karega
      let cleanPhone = digitsOnly;
      let altPhone = digitsOnly;
      if (cleanPhone.startsWith("92")) {
        altPhone = "0" + cleanPhone.slice(2);
      } else if (cleanPhone.startsWith("0")) {
        cleanPhone = "92" + cleanPhone.slice(1);
      }

      orders = await Order.find({
        $or: [
          { phone: cleanPhone },
          { phone: altPhone },
          { phone: cleanQuery },
        ],
      }).sort({ createdAt: -1 });
    } else {
      // 🟢 2. Order ID se search: Strict exact 6 characters rule
      if (shortHex.length !== 6) {
        return NextResponse.json(
          { success: false, message: "Order ID must be exactly 6 characters (e.g. #ORD-XXXXXX)." },
          { status: 400 }
        );
      }

      const allOrders = await Order.find().sort({ createdAt: -1 }).limit(300);
      orders = allOrders.filter(
        (ord) => ord._id.toString().slice(-6).toUpperCase() === shortHex
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { success: false, message: "No order record found matching your details." },
        { status: 404 }
      );
    }

    // 🟢 3. Saare matching orders ke items aur watches details enrich karein
    const enrichedOrders = await Promise.all(
      orders.map(async (targetOrder) => {
        const shortId = targetOrder._id.toString().slice(-6).toUpperCase();
        const formattedOrderId = `#ORD-${shortId}`;

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

        if (enrichedItems.length === 0) {
          enrichedItems.push({
            title: targetOrder.watchTitle,
            price: targetOrder.watchPrice,
            quantity: 1,
            image: "/wClassic.png",
            spec: "SWISS PRECISION MOVEMENT",
          });
        }

        return {
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
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
    });
  } catch (error) {
    console.error("Tracking API Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error occurred while tracking." },
      { status: 500 }
    );
  }
}