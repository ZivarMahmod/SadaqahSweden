export const metadata = {
  title: "Konto fryst — Sadaqah Sweden",
};

export default function KontoFrystPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Ditt konto är pausat
      </h1>
      <p className="mt-4 text-base">
        Kontot är tillfälligt fryst av en administratör. Skriv till{" "}
        <a href="mailto:kontakt@sadaqahsweden.se" className="underline">
          kontakt@sadaqahsweden.se
        </a>{" "}
        för att höra varför och vad som krävs för att aktivera det igen.
      </p>
    </main>
  );
}
