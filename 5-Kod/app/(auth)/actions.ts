"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loggaIn(formData: FormData): Promise<AuthResult> {
  const epost = String(formData.get("epost") ?? "").trim();
  const losenord = String(formData.get("losenord") ?? "");

  if (!epost || !losenord) {
    return { ok: false, message: "Fyll i e-post och lösenord." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: epost,
    password: losenord,
  });

  if (error) {
    return { ok: false, message: oversaettAuthFel(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/konto");
}

export async function registrera(formData: FormData): Promise<AuthResult> {
  const epost = String(formData.get("epost") ?? "").trim();
  const losenord = String(formData.get("losenord") ?? "");
  const visningsnamn = String(formData.get("visningsnamn") ?? "").trim();

  if (!epost || !losenord || !visningsnamn) {
    return {
      ok: false,
      message: "Fyll i e-post, lösenord och visningsnamn.",
    };
  }

  if (losenord.length < 10) {
    return {
      ok: false,
      message: "Lösenordet måste vara minst 10 tecken.",
    };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: epost,
    password: losenord,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      // Visningsnamn skickas som user_metadata; handle_new_user-triggern
      // använder e-postens lokala del om inget annat finns. Klienten kan
      // alltid uppdatera visningsnamn senare via egen-rad-policyn.
      data: { visningsnamn },
    },
  });

  if (error) {
    return { ok: false, message: oversaettAuthFel(error.message) };
  }

  // Email-bekräftelse skickad av Supabase. Användaren landar på /verifiera-epost
  // för instruktioner.
  redirect("/verifiera-epost");
}

export async function loggaUt(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

function oversaettAuthFel(msg: string): string {
  // Supabase-felmeddelanden är på engelska. Översätt vanligaste:
  if (msg.includes("Invalid login credentials")) return "Fel e-post eller lösenord.";
  if (msg.includes("Email not confirmed")) return "Bekräfta din e-post först (kolla din inkorg).";
  if (msg.includes("User already registered")) return "Den e-postadressen finns redan. Logga in istället.";
  if (msg.includes("Password should be at least")) return "Lösenordet är för kort.";
  if (msg.toLowerCase().includes("password") && msg.toLowerCase().includes("breach"))
    return "Det lösenordet har förekommit i läckta databaser. Välj ett annat.";
  return msg;
}
