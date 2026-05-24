# Min byggresa — Sadaqa Sweden

*En logg över aha-stunder, sådant jag fångade, och hur jag lär mig. Den växer allteftersom bygget går framåt.*

---

## Vem jag är i det här bygget

Jag bygger Sadaqa Sweden — en insamlingsplattform för det muslimska samhället i Sverige. Jag gör det som amal, för Allahs skull, inte för vinst.

Jag är inte utvecklare. Men jag är den som styr bygget: jag planerar, fattar besluten, håller riktningen. Själva koden skrivs av Claude Code — men jag förstår systemet, och jag lär mig lagret under medan vi bygger. Det här dokumentet är spåret av det lärandet.

---

## Aha-stunder

### 2026-05-24 — Publik nyckel vs hemlig nyckel
Jag trodde först att det var "en nyckel för Code, en för databasen". Det klickade när jag såg det rätt: en **publik** nyckel hör till webbsidan — den får synas, den är ofarlig. En **hemlig** nyckel hör till servern — den får aldrig synas. Och samma par finns i både test och live. Fyra nycklar, två världar.

### 2026-05-24 — Test och live är skilda världar
Jag frågade om Code kunde ta live-nycklarna och "hämta det den behöver" till test. Svaret blev nej — och varför fastnade: test och live är helt åtskilda i Stripe. Testvärlden börjar tom, man bygger testdatan där, med fejk-kort. Det är hela poängen: ingen riktig krona rör sig medan man verifierar.

### 2026-05-24 — Webhooks gömmer sig i Workbench
Stripe har byggt om sitt gränssnitt. Utvecklarverktygen — webhooks, loggar, CLI — ligger inte i vanliga menyn längre, utan i en panel som heter Workbench. Det som såg "borta" ut var bara gömt tills man tog fram rätt yta.

### 2026-05-24 — Jag hittade Stripe Shell själv
Inne i Workbench upptäckte jag en inbyggd CLI — Stripe Shell. Det blev den smartaste vägen: istället för att bocka i fjorton händelsetyper för hand skapade vi båda webhooks med två kommandon.

---

## Vad jag fångade — saker som nästan slapp förbi

### 2026-05-24 — Jag stoppade gissningarna
Instruktionerna jag fick byggde ett tag på en gammal version av Stripes gränssnitt. Jag sa ifrån rakt: *"ta reda på hur Stripe ser ut nu på riktigt innan du missleder mig vidare."* Det tvingade fram att vi slog upp dokumentationen istället för att gissa. En bra reflex — att inte gå vidare på osäker mark.

### 2026-05-24 — Jag höll fast vid min plan
Förslaget var att testa hela pengaflödet direkt. Jag höll emot med min egen logik: bygg klart delarna, testa allt på slutet. Vi bröt isär det och landade i en mellanväg — ett billigt röktest av grunden nu, det stora skarpa testet kvar som final. Jag lät mig inte bara övertalas; jag drev min linje tills den möttes.

### 2026-05-24 — Fel testnycklar
Testnycklarna som låg i env-filen visade sig höra till en gammal Corevo-sandlåda — inte Sadaqa-kontot. Det syntes i kontonumren. Jag fångade det via skärmbilder, och rensade bort Corevo-sandlådan så bara den rätta blev kvar.

### 2026-05-24 — Live-nyckeln i klartext
En live-nyckel låg i klartext i env-filen. Den flaggades som en risk. Jag tog till mig varför, och gjorde en sund plan istället för att stressa: filen är ställning under bygget, nycklarna roteras när allt är på plats.

---

## Hur jag lär mig

Mönster jag känner igen hos mig själv:

- **Ett steg i taget.** Jag ber om en uppgift, gör den, rapporterar, tar nästa. Inte tio steg på en gång.
- **Jag frågar varför.** Jag nöjer mig inte med "gör så här". Jag vill ha modellen, bilden — då fastnar det.
- **Jag visar istället för att beskriva.** När något inte stämmer skickar jag en skärmbild av exakt vad jag ser.
- **Jag accepterar inte hand-viftande.** Gissningar och "ungefär" stoppar jag. Det ska stämma.

---

*Nästa gång något klickar, eller jag fångar något som höll på att gå fel — skrivs det upp här.*
