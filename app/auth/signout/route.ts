import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/supabase/server";
import { isAuthConfigured } from "@/lib/validation/env";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  if (isAuthConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/`, { status: 303 });
}

export async function GET(request: Request) {
  return POST(request);
}
