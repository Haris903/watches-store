import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Watch from "@/models/Watch";
import User from "@/models/User"; // 🟢 Added User model
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: All Watches for Store & Admin
export async function GET() {
  try {
    await dbConnect();
    const watches = await Watch.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, watches });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Add Watch in exact collection & sub-category
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    let imageUrl = body.image || "/wClassic.png";
    if (body.imageBase64) {
      const uploadRes = await cloudinary.uploader.upload(body.imageBase64, {
        folder: "watches_store_products",
      });
      imageUrl = uploadRes.secure_url;
    }

    const targetCollection = (body.collectionName || body.category || "featured").toLowerCase();

    const newWatch = await Watch.create({
      title: body.title,
      price: Number(body.price),
      originalPrice: body.originalPrice ? Math.round(Number(body.originalPrice)) : Math.round(Number(body.price) * 1.3),
      collectionName: targetCollection,
      category: targetCollection,
      subCategory: body.subCategory || "Automatic",
      spec: body.spec || "SWISS PRECISION MOVEMENT",
      description: body.description || "",
      image: imageUrl,
      stock: Number(body.stock) || 10,
      tag: body.tag || "",
      rating: Number(body.rating) || 4.9,
      reviews: Number(body.reviews) || 24,
    });

    return NextResponse.json({ success: true, watch: newWatch });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update Price, Image, Categories, Description, ya Stock
export async function PUT(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const {
      id,
      title,
      price,
      originalPrice,
      collectionName,
      category,
      subCategory,
      description,
      stock,
      tag,
      rating,
      reviews,
      imageBase64,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    let imageUrl = undefined;
    if (imageBase64) {
      const uploadRes = await cloudinary.uploader.upload(imageBase64, {
        folder: "watches_store_products",
      });
      imageUrl = uploadRes.secure_url;
    }

    const targetCollection = collectionName || category;

    const updateFields = {
      ...(title && { title }),
      ...(price !== undefined && { price: Number(price) }),
      ...(originalPrice !== undefined && { originalPrice: Math.round(Number(originalPrice)) }),
      ...(targetCollection && {
        collectionName: targetCollection.toLowerCase().trim(),
        category: targetCollection.toLowerCase().trim(),
      }),
      ...(subCategory && { subCategory }),
      ...(description !== undefined && { description }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(tag !== undefined && { tag }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(reviews !== undefined && { reviews: Number(reviews) }),
      ...(imageUrl && { image: imageUrl }),
    };

    const updatedWatch = await Watch.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedWatch) {
      return NextResponse.json(
        { success: false, error: "Watch not found" },
        { status: 404 }
      );
    }

    // 🟢 Agar admin dashboard se stock 0 ya negative kar diya jaye toh tamam users ke cart se delete karein
    if (updatedWatch.stock <= 0) {
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
    }

    return NextResponse.json({ success: true, watch: updatedWatch });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete Watch
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await Watch.findByIdAndDelete(id);

      // 🟢 Watch delete hote hi tamam users ke cart se bhi delete karein
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
    }

    return NextResponse.json({ success: true, message: "Watch deleted from store and carts" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}