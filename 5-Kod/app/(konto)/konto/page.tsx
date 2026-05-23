import { kraver } from "@/lib/auth";
import { loggaUt } from "@/app/(auth)/actions";

export const metadata = {
  title: "Mitt konto — Sadaqah Sweden",
};

export default async function KontoPage() {
  const me = await kraver();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mitt konto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Provisorisk vy. M9 (profiler) bygger den riktiga konto-sidan.
      </p>

      <dl className="mt-8 grid gap-3 text-sm">
        <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
          <dt className="text-muted-foreground">Visningsnamn</dt>
          <dd>{me.profil.visningsnamn}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
          <dt className="text-muted-foreground">E-post</dt>
          <dd>{me.epost}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
          <dt className="text-muted-foreground">Roll</dt>
          <dd>
            <span className="inline-flex items-center rounded-full border border-black/15 px-2.5 py-0.5 text-xs font-medium">
              {me.roll}
            </span>
          </dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
          <dt className="text-muted-foreground">BankID verifierad</dt>
          <dd>{me.profil.bankid_verifierad ? "Ja" : "Nej (krävs för insamlare)"}</dd>
        </div>
        <div className="grid grid-cols-[140px_1fr] items-baseline gap-3">
          <dt className="text-muted-foreground">Publikt ID</dt>
          <dd>
            <code>{me.profil.public_id}</code>
          </dd>
        </div>
      </dl>

      <form action={loggaUt} className="mt-12">
        <button
          type="submit"
          className="rounded-md border border-black/20 px-4 py-2 text-sm hover:bg-black/5"
        >
          Logga ut
        </button>
      </form>
    </main>
  );
}
