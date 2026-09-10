import { NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/validation/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    authConfigured: isAuthConfigured(),
  });
}
