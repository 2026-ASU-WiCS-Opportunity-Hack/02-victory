import { NextResponse, type NextRequest } from "next/server";
import { getDashboardStats } from "@/lib/data/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const chartStart = startParam ? new Date(startParam) : undefined;
  // Include the full end day
  let chartEnd: Date | undefined;
  if (endParam) {
    chartEnd = new Date(endParam);
    chartEnd.setHours(23, 59, 59, 999);
  }

  try {
    const stats = await getDashboardStats(chartStart, chartEnd);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
