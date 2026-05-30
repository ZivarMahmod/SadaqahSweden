import "server-only";
// Sadaqah Sweden — Provider-registret (brief 33 F3).
// Factory som returnerar rätt betalleverantör. Stripe är default (v1, DEL 7).
// Konfigurerbart per insamling via `insamling.betal_provider` (default 'stripe').

import type { PaymentProvider, PayoutProvider } from "./types";
import { StripeProvider } from "./stripe-provider";

export const DEFAULT_PROVIDER = "stripe" as const;

// Singleton-instanser per provider-namn.
const instanser = new Map<string, StripeProvider>();

function hamta(namn: string): StripeProvider {
  const nyckel = namn || DEFAULT_PROVIDER;
  let inst = instanser.get(nyckel);
  if (!inst) {
    switch (nyckel) {
      case "stripe":
        inst = new StripeProvider();
        break;
      default:
        // Okänd provider → falla tillbaka på Stripe (default), aldrig krascha
        // ett pengaflöde på en felkonfig. En framtida PSP registreras här.
        inst = new StripeProvider();
        break;
    }
    instanser.set(nyckel, inst);
  }
  return inst;
}

/** Returnerar PaymentProvider för ett provider-namn (default 'stripe'). */
export function getPaymentProvider(provider?: string): PaymentProvider {
  return hamta(provider ?? DEFAULT_PROVIDER);
}

/** Returnerar PayoutProvider för ett provider-namn (default 'stripe'). */
export function getPayoutProvider(provider?: string): PayoutProvider {
  return hamta(provider ?? DEFAULT_PROVIDER);
}
