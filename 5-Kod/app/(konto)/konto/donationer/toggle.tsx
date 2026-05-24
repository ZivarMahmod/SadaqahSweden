"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVisaDonationerAction } from "./toggle-action";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function ToggleVisaDonationer({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [pa, setPa] = useState(initial);
  const [pending, start] = useTransition();

  function toggla() {
    const nytt = !pa;
    if (
      nytt &&
      !confirm(
        "Slå PÅ öppen vy? Då visas antal donationer (ingen summa) på din publika profil.",
      )
    )
      return;
    start(async () => {
      const r = await toggleVisaDonationerAction(nytt);
      if (r.ok) {
        setPa(r.visa);
        router.refresh();
      }
    });
  }

  return (
    <Button
      type="button"
      variant={pa ? "primary" : "secondary"}
      size="sm"
      onClick={toggla}
      disabled={pending}
      leftIcon={<Icon name={pa ? "eye" : "eye-off"} size={14} />}
    >
      {pending ? "Sparar…" : pa ? "Öppen vy: PÅ" : "Öppen vy: AV"}
    </Button>
  );
}
