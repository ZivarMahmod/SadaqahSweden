import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email-bekräftelse-callback för Supabase Auth.
// Användaren landar här efter att ha klickat länken i bekräftelsemejlet.
// `code` byts mot en session, sen redirect till /konto (eller annan `next`).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/konto";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Misslyckades: gå till login med felflagga.
  return NextResponse.redirect(new URL("/login?fel=auth_callback", url.origin));
}
