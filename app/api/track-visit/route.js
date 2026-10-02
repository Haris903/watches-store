import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Visit from "@/models/Visit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    await dbConnect();
    const { visitorId, page } = await req.json();
    const session = await getServerSession(authOptions);

    const isAuth = !!session?.user;

    // Database mein entry create karein
    await Visit.create({
      visitorId: visitorId || "anonymous",
      isAuthorized: isAuth,
      userEmail: session?.user?.email || null,
      userName: session?.user?.name || null,
      page: page || "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}