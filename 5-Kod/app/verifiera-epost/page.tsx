export const metadata = {
  title: "Verifiera din e-post — Sadaqah Sweden",
};

export default function VerifieraEpostPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Kolla din inkorg
      </h1>
      <p className="mt-4 text-base">
        Vi har skickat en länk till e-postadressen du angav. Klicka på den
        för att bekräfta ditt konto.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Hittar du inget? Kolla skräppost-mappen. Mejlet kommer från
        <code className="ml-1">no-reply@supabase.co</code> tills föreningens
        egen avsändare är konfigurerad.
      </p>
    </main>
  );
}
