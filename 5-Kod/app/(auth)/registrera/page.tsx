import Link from "next/link";
import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { RegistreraForm } from "./registrera-form";

export const metadata = {
  title: "Skapa konto — Sadaqah Sweden",
};

export default async function RegistreraPage() {
  const me = await aktuellAnvandare();
  if (me) redirect("/konto");

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Skapa konto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Du startar som donator. Vill du senare bli insamlare krävs BankID +
        Stripe-onboarding.
      </p>

      <RegistreraForm />

      <p className="mt-8 text-sm">
        Har du redan ett konto?{" "}
        <Link href="/login" className="underline">
          Logga in
        </Link>
        .
      </p>
    </main>
  );
}
