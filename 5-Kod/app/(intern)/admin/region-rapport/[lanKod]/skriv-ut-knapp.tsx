"use client";

export function SkrivUtKnapp() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary btn-sm"
    >
      Skriv ut / spara som PDF
    </button>
  );
}
