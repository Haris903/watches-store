import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Visit from "@/models/Visit";

export async function GET() {
  try {
    await dbConnect();

    // Aaj ki date ka start time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalVisits, todayVisits, authorizedVisits, guestVisits] = await Promise.all([
      Visit.countDocuments({}),
      Visit.countDocuments({ createdAt: { $gte: startOfToday } }),
      Visit.countDocuments({ isAuthorized: true }),
      Visit.countDocuments({ isAuthorized: false }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalVisits,
        todayVisits,
        authorizedVisits, // Logged-in users
        guestVisits,      // Unauthorized / Guest traffic
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}