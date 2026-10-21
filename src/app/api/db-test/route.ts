
import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "MongoDB Atlas connection successful",
      database: db.databaseName,
    });
  } catch {
    console.error("MongoDB connection test failed.");

    return NextResponse.json(
      { success: false, message: "MongoDB connection failed. Check the server terminal." },
      { status: 500 }
    );
  }
}
