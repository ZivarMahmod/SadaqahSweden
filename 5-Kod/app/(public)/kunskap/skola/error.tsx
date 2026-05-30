"use client";

// Skolan — fel-läge (tillstånds-grammatik). Fångar oväntade fel i skol-ytorna.
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function SkolaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logga klient-side; ingen känslig data.
    console.error("Skolan – oväntat fel:", error);
  }, [error]);

  return (
    <div
      className="card card-bare flex flex-col items-center gap-4 px-8 py-16 text-center"
      style={{ border: "1px dashed var(--color-paper-line)" }}
      role="alert"
    >
      <h3 className="heading-3">Något gick fel</h3>
      <p className="lead mx-auto max-w-md" style={{ fontSize: 16 }}>
        Skol-ytan kunde inte visas just nu. Försök igen.
      </p>
      <Button variant="primary" onClick={reset}>
        Försök igen
      </Button>
    </div>
  );
}
