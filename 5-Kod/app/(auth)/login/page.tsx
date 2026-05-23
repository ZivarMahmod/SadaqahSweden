import Link from "next/link";
import { redirect } from "next/navigation";
import { aktuellAnvandare } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Logga in — Sadaqah Sweden",
};

export default async function LoginPage() {
  // Om redan inloggad, skicka vidare till konto-sidan.
  const me = await aktuellAnvandare();
  if (me) redirect("/konto");

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Logga in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sadaqah Sweden — fortsätt med din e-post.
      </p>

      <LoginForm />

      <p className="mt-8 text-sm">
        Inget konto?{" "}
        <Link href="/registrera" className="underline">
          Skapa ett här
        </Link>
        .
      </p>
    </main>
  );
}
