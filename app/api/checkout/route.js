import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Order from "@/models/Order";
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
    const { name, phone, email, address, paymentMethod, watchTitle, watchPrice, screenshotName, screenshotBase64 } = body;

    if (!name || !phone || !address || !screenshotBase64) {
      return NextResponse.json(
        { success: false, message: "Required fields miss hain." },
        { status: 400 }
      );
    }

    // 1. Upload Base64 Image to Cloudinary
    let cloudinaryUrl = "";
    try {
      const uploadRes = await cloudinary.uploader.upload(screenshotBase64, {
        folder: "watches_store_orders",
      });
      cloudinaryUrl = uploadRes.secure_url;
    } catch (uploadError) {
      console.error("Cloudinary Upload Error:", uploadError);
      return NextResponse.json(
        { success: false, message: "Screenshot upload fail ho gaya." },
        { status: 500 }
      );
    }

    // 2. Save Order to MongoDB Database
    const newOrder = await Order.create({
      name,
      phone,
      email,
      address,
      paymentMethod: paymentMethod || "JazzCash", // <--- Database mein store ho jaye ga
      watchTitle,
      watchPrice,
      screenshotName: screenshotName || "payment-receipt.png",
      screenshotUrl: cloudinaryUrl,
    });

    // 3. Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Format Base64 Image for Email Attachment
    let attachments = [];
    if (screenshotBase64) {
      const base64Data = screenshotBase64.split(";base64,").pop();
      attachments.push({
        filename: screenshotName || "payment-receipt.png",
        content: base64Data,
        encoding: "base64",
      });
    }

    // 5. Email HTML Template & Options
    const mailOptions = {
      from: `"Talha Watches" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Watch Order: ${watchTitle} (${name})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #111; color: #fff; border-radius: 10px;">
          <h2 style="color: #DCAA4A; border-bottom: 1px solid #333; padding-bottom: 10px;">New Order Received!</h2>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Phone / WhatsApp:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email || "Not Provided"}</p>
          <p><strong>Shipping Address:</strong> ${address}</p>
          <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;">
          <p><strong>Payment Method Used:</strong> <span style="color: #DCAA4A; font-weight: bold;">${paymentMethod || "Not Specified"}</span></p>
          <p><strong>Watch Title:</strong> ${watchTitle}</p>
          <p><strong>Total Amount:</strong> <span style="color: #DCAA4A;">${watchPrice}</span></p>
          <p style="margin-top: 15px; font-size: 12px; color: #888;">Payment screenshot attached below.</p>
          <p><a href="${cloudinaryUrl}" target="_blank" style="color: blue;">Click Here and View Online Screenshot</a></p>
        </div>
      `,
      attachments: attachments,
    };

    // 6. Send Email Notification
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: "Order successfully saved and email sent!", orderId: newOrder._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout API & Nodemailer Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error or email sending failed." },
      { status: 500 }
    );
  }
}