// /team — kräver inloggning men ingen specifik roll (accept-invite kan kallas
// av användare innan rollen är satt). Återanvänd publik chrome.
import { ChromePublic } from "@/components/layout/site-nav";
import { Footer } from "@/components/layout/footer";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ChromePublic />
      {children}
      <Footer />
    </>
  );
}
