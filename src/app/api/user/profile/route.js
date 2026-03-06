import corsHeaders from "@/lib/cors";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status, headers: corsHeaders });
  }

  const user = auth.user;
  return NextResponse.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name || "",
    role: user.role,
    isLoggedIn: true,
  }, { headers: corsHeaders });
}
