import corsHeaders from "@/lib/cors";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  await ensureIndexes();
  return NextResponse.json({
    message: "Ready",
    testUsers: [
      { role: "ADMIN", email: "admin@test.com", password: "admin123" },
      { role: "USER", email: "user@test.com", password: "user123" },
    ],
  }, { headers: corsHeaders });
}
