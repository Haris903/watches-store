import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Order from "@/models/Order";
import Watch from "@/models/Watch";
import User from "@/models/User";
import nodemailer from "nodemailer";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    // 🟢 1. STRICT SERVER-SIDE SANITIZATION & TRIMMING
    // Aage-peeche ke spaces khatam + beech ke double spaces ko single space banana
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const email = String(body.email || "").trim().toLowerCase();
    const address = String(body.address || "").trim().replace(/\s+/g, " ");
    const paymentMethod = String(body.paymentMethod || "JazzCash").trim();
    const watchTitle = String(body.watchTitle || "Luxury Timepiece").trim();
    const watchPrice = String(body.watchPrice || "").trim();
    const screenshotName = String(body.screenshotName || "payment-receipt.png").trim();
    const screenshotBase64 = body.screenshotBase64;
    const items = Array.isArray(body.items) ? body.items : [];

    // 🟢 2. PHONE NUMBER STRICT CLEANING (Spaces, dashes khatam & 92 format)
    let cleanPhone = String(body.phone || "").replace(/\D/g, ""); // Sirf numbers bachenge
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "92" + cleanPhone.slice(1);
    } else if (cleanPhone.startsWith("0092")) {
      cleanPhone = cleanPhone.slice(2);
    } else if (!cleanPhone.startsWith("92") && cleanPhone.length === 10) {
      cleanPhone = "92" + cleanPhone;
    }

    if (!name || !cleanPhone || !address || !screenshotBase64) {
      return NextResponse.json(
        { success: false, message: "Required fields are missing." },
        { status: 400 }
      );
    }

    // 3. Upload Receipt to Cloudinary
    let cloudinaryUrl = "";
    try {
      const uploadRes = await cloudinary.uploader.upload(screenshotBase64, {
        folder: "watches_store_orders",
      });
      cloudinaryUrl = uploadRes.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary Upload Error:", uploadError);
      return NextResponse.json(
        { success: false, message: "Receipt upload failed." },
        { status: 500 }
      );
    }

    // 4. Save Clean Data to Database
    const newOrder = await Order.create({
      name,
      phone: cleanPhone,
      email,
      address,
      paymentMethod,
      watchTitle,
      watchPrice,
      items,
      screenshotName,
      screenshotUrl: cloudinaryUrl,
    });

    const orderId = newOrder._id.toString();
    const shortId = orderId.slice(-6).toUpperCase();
    const formattedOrderId = `ORD-#${shortId}`;

    // 5. Auto-Deduct Stock & Global Cart Purge
    if (items.length > 0) {
      for (const item of items) {
        const watchId = item.id || item._id;
        const qtyToMinus = Number(item.quantity) || 1;
        if (watchId) {
          const updatedWatch = await Watch.findByIdAndUpdate(
            watchId,
            { $inc: { stock: -qtyToMinus } },
            { new: true }
          );

          if (updatedWatch && updatedWatch.stock <= 0) {
            await User.updateMany(
              {},
              {
                $pull: {
                  cart: {
                    $or: [
                      { id: String(watchId) },
                      { _id: String(watchId) },
                      { id: watchId },
                      { _id: watchId },
                    ],
                  },
                },
              }
            );
          }
        }
      }
    }

    // 🟢 6. ORIGINAL CREDENTIALS CLEANING (Env spaces removed)
    const cleanEmailUser = String(process.env.EMAIL_USER || "").trim();
    const cleanEmailPass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: cleanEmailUser,
        pass: cleanEmailPass,
      },
    });

    let attachments = [];
    if (screenshotBase64 && screenshotBase64.includes(";base64,")) {
      const base64Data = screenshotBase64.split(";base64,").pop();
      attachments.push({
        filename: screenshotName,
        content: base64Data,
        encoding: "base64",
      });
    }

    // 🟢 7. ADMIN ORDER EMAIL (English)
    const adminMailOptions = {
      from: `"Elegance Store Alerts" <${cleanEmailUser}>`,
      to: cleanEmailUser,
      subject: `New Order Received [${formattedOrderId}]: ${watchTitle} (${name})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #0a0a0a; color: #fff; border-radius: 14px; border: 1px solid #222; max-width: 600px; margin: auto;">
          <h2 style="color: #DCAA4A; border-bottom: 1px solid #262626; padding-bottom: 12px; margin-top: 0;">New Luxury Order Received!</h2>
          <div style="background: #171717; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #DCAA4A;">
            <p style="margin: 0; font-size: 13px; color: #888;">Order Reference</p>
            <h3 style="margin: 4px 0 0 0; color: #DCAA4A; font-size: 22px;">${formattedOrderId}</h3>
          </div>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Phone / WhatsApp:</strong> +${cleanPhone}</p>
          <p><strong>Customer Email:</strong> ${email || "Not Provided"}</p>
          <p><strong>Shipping Address:</strong> ${address}</p>
          <hr style="border: 0; border-top: 1px solid #262626; margin: 16px 0;">
          <p><strong>Payment Gateway:</strong> <span style="color: #DCAA4A; font-weight: bold;">${paymentMethod}</span></p>
          <p><strong>Ordered Items:</strong><br><span style="color: #f5f5f5; font-size: 15px;">${watchTitle}</span></p>
          <p><strong>Total Bill:</strong> <span style="color: #DCAA4A; font-size: 18px; font-weight: bold;">${watchPrice}</span></p>
          <p style="margin-top: 20px;"><a href="${cloudinaryUrl}" target="_blank" style="display: inline-block; background: #DCAA4A; color: #000; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Online Receipt</a></p>
        </div>
      `,
      attachments: attachments,
    };

    await transporter.sendMail(adminMailOptions);
    console.log("✅ Admin Email Sent to:", cleanEmailUser);

    // 🟢 8. CUSTOMER ORDER CONFIRMATION EMAIL (English & Spam-Proof Clean Structure)
    if (email && email.includes("@")) {
      try {
       // 🟢 8. ANTI-PHISHING CLEAN CUSTOMER EMAIL
        const customerMailOptions = {
          from: `"Elegance Watches" <${cleanEmailUser}>`,
          to: email,
          replyTo: cleanEmailUser,
          // Subject se symbols aur aggressive keywords hata diye hain
          subject: `Your Elegance Order Receipt ${formattedOrderId}`,
          text: `Hello ${name},\n\nThank you for placing an order with Elegance On Your Wrist.\n\nOrder Details:\nID: ${formattedOrderId}\nItem: ${watchTitle}\nTotal: ${watchPrice}\nDelivery Address: ${address}\n\nOur team is currently reviewing your payment receipt. Your package will be prepared for dispatch once verified.\n\nNeed assistance? Reply directly to this email or reach us on WhatsApp at +92 318 664 3032.\n\nWarm regards,\nElegance Watches Team`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1a202c; background-color: #ffffff;">
              <h2 style="margin: 0 0 12px; font-size: 20px; color: #0f172a; font-weight: 700;">Order Receipt</h2>
              <p style="font-size: 14px; margin: 0 0 16px; color: #475569;">Hello <strong>${name}</strong>, thank you for shopping with Elegance On Your Wrist. We have received your order details.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #edf2f7; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 13px; line-height: 1.6;">
                <p style="margin: 0 0 8px;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-size: 14px; color: #b45309;">${formattedOrderId}</span></p>
                <p style="margin: 0 0 8px;"><strong>Item:</strong> ${watchTitle}</p>
                <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${watchPrice}</p>
                <p style="margin: 0;"><strong>Shipping Destination:</strong> ${address}</p>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 24px;">Our concierge team is verifying the payment receipt. Once approved, tracking information will be forwarded to your contact number.</p>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
                <p style="margin: 0;">Support: +92 318 664 3032 | ${cleanEmailUser}</p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(customerMailOptions);
        console.log("✅ Customer Confirmation Email Sent to:", email);
      } catch (custEmailErr) {
        console.error("❌ Customer Email Error:", custEmailErr);
      }
    }

    // 🟢 9. WHATSAPP AUTO-MESSAGE PAYLOAD IN ENGLISH
    const whatsappMessage = `*Elegance On Your Wrist - Order Confirmation* ✨\n\nDear *${name}*,\n\nThank you for your purchase! Your order has been placed successfully.\n\n📌 *Order ID:* ${formattedOrderId}\n⌚ *Timepiece(s):* ${watchTitle}\n💰 *Total Amount:* ${watchPrice}\n📍 *Shipping Destination:* ${address}\n💳 *Payment Gateway:* ${paymentMethod}\n\nOur concierge team is verifying your payment receipt. Tracking details will be dispatched shortly. Thank you!`;

    const directWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully!",
        orderId: newOrder._id,
        formattedOrderId,
        customerPhone: cleanPhone,
        whatsappUrl: directWaUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Fatal Checkout API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error occurred." },
      { status: 500 }
    );
  }
}