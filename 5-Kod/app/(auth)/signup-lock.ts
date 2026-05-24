// Pre-launch lock: kontoskapande är avstängt tills lansering. Live på publik
// domän — visar "tillfälligt avstängt"-meddelande på /registrera och rejectar
// `registrera`-actionet server-side så ingen account skapas även om någon
// POST:ar direkt mot action:en. Admin-subdomänen har en egen, hård gate
// (arAdminHost) som blockerar oavsett detta värde.
//
// Egen modul (inte i actions.ts) eftersom Next.js `"use server"`-filer bara
// får exportera async funktioner — inte vanliga const.
export const SIGNUP_LOCKED = true;
