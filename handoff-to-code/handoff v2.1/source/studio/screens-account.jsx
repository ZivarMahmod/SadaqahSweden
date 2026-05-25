// ============================================================
// SADAQA STUDIO — INSAMLARE SCREENS
// Account · Wizard · Update
// ============================================================

const { useState: useStateA, useMemo: useMemoA } = React;
const DA = window.STUDIO_DATA;

// ============================================================
// ACCOUNT — dashboard view for an insamlare
// (this is the same logged-in user; reuses ChromeInsamlare from outside)
// ============================================================
function AccountScreen({ onNav }) {
  const [tab, setTab] = useStateA('active');
  return (
    <div className="studio" style={{ background: 'var(--paper)' }}>
      <section style={{ padding: '40px 0 0' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>MITT KONTO · INSAMLARE · STOCKHOLM</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
            <h1 className="mag-h1" style={{ fontSize: 56 }}>Hej Yasmin.</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn variant="secondary" size="sm" onClick={() => onNav('update')}><Icon name="plus" size={14} /> Lägg upp bevis</Btn>
              <Btn variant="primary" size="lg" onClick={() => onNav('wizard')}><Icon name="plus" size={14} /> Ny insamling</Btn>
            </div>
          </div>

          {/* KPI ROW */}
          <div className="dash-kpi-row">
            <div className="dash-kpi">
              <span className="label">PÅGÅENDE NU</span>
              <span className="figure">1</span>
              <span className="sub" style={{ color: 'var(--success)' }}>● Aktiv · 74 % av målet</span>
            </div>
            <div className="dash-kpi">
              <span className="label">SAMLAT IN TOTALT</span>
              <span className="figure tnum">2,48 mkr</span>
              <span className="sub">Över 8 avslutade projekt</span>
            </div>
            <div className="dash-kpi">
              <span className="label">DONATÖRER (LIVE)</span>
              <span className="figure tnum">287</span>
              <span className="sub" style={{ color: 'var(--success)' }}>↑ 14 senaste 7 dgr</span>
            </div>
            <div className="dash-kpi">
              <span className="label">TRUST-POÄNG</span>
              <span className="figure tnum">92</span>
              <span className="sub">Av 100 — toppskikt</span>
            </div>
          </div>

          {/* TODO CARDS */}
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 20, border: '1px solid var(--accent)', background: 'rgba(184,132,62,0.06)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>BEVIS BEHÖVS</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: 0 }}>Lägg upp resultat-bevis</h4>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>Iftar Stockholm 2024 saknar slutbevis. Donatörer väntar.</p>
              <Btn variant="accent" size="sm" onClick={() => onNav('update')} style={{ marginTop: 6, alignSelf: 'flex-start' }}>Posta nu →</Btn>
            </div>
            <div style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
              <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>UPPDATERING SCHEMALAGD</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: 0 }}>Diabaly: midway-bevis</h4>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>Schemalagd 12 juni när borrlaget är på plats.</p>
              <Btn variant="ghost" size="sm" style={{ marginTop: 6, padding: 0, alignSelf: 'flex-start' }}>Justera →</Btn>
            </div>
            <div style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
              <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>FRÅGOR · 2 OBESVARADE</div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, margin: 0 }}>Donatorfrågor</h4>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>"Kommer pumpen att fungera i torka?" och en till.</p>
              <Btn variant="ghost" size="sm" style={{ marginTop: 6, padding: 0, alignSelf: 'flex-start' }}>Svara →</Btn>
            </div>
          </div>
        </div>
      </section>

      {/* TABS + TABLE */}
      <section style={{ padding: '56px 0 96px' }}>
        <div className="mag-container">
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ink)', marginBottom: 28 }}>
            {[
              { id: 'active', label: 'Aktiva', count: 1 },
              { id: 'drafts', label: 'Utkast', count: 2 },
              { id: 'review', label: 'Under granskning', count: 1 },
              { id: 'done',   label: 'Avslutade', count: 8 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      style={{ background: 'none', border: 0, padding: '14px 18px', cursor: 'pointer', borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'), marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-ui)' }}>
                <span style={{ fontSize: 14, fontWeight: tab === t.id ? 600 : 500, color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)' }}>{t.label}</span>
                <span style={{ background: tab === t.id ? 'var(--ink)' : 'var(--paper-soft)', color: tab === t.id ? 'var(--paper)' : 'var(--ink-3)', fontSize: 11, padding: '2px 7px', borderRadius: 2, fontWeight: 600 }}>{t.count}</span>
              </button>
            ))}
          </div>

          <table className="dash-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}></th>
                <th>Projekt</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Insamlat</th>
                <th style={{ textAlign: 'right' }}>Donatörer</th>
                <th style={{ textAlign: 'right' }}>Slut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(tab === 'active' ? [DA.campaigns[0]] :
                tab === 'drafts' ? [{ title: 'Qurban 2026 — Somalia', status: 'Utkast', raised: 0, donors: 0, daysLeft: '—' }, { title: 'Vatten Etiopien', status: 'Utkast', raised: 0, donors: 0, daysLeft: '—' }] :
                tab === 'review' ? [{ title: 'Sjukvård Stockholm', status: 'Hos granskare', raised: 0, donors: 0, daysLeft: '—' }] :
                ['Iftar Stockholm 2025', 'Vinterhjälp Aleppo', 'Vattentankar Somalia', 'Skolböcker Bangladesh', 'Medicinsk hjälp Pakistan', 'Föräldralösa Jemen', 'Iftar Rinkeby 2023', 'Brunn Etiopien'].map(t => ({ title: t, status: 'Avslutad', raised: 50000 + Math.random() * 200000 | 0, donors: 30 + Math.random() * 300 | 0, daysLeft: '—' }))
              ).map((c, i) => (
                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => onNav('fundraiser')}>
                  <td><div style={{ width: 36, height: 36, background: 'var(--forest-soft)', borderRadius: 2 }} /></td>
                  <td><strong>{c.title}</strong></td>
                  <td>
                    {c.status === 'Avslutad' ? <Tag tone="outline">✓ Avslutad</Tag> :
                     c.status === 'Utkast' ? <Tag tone="outline">Utkast</Tag> :
                     c.status === 'Hos granskare' ? <Tag tone="accent">⏳ Hos granskare</Tag> :
                     <Tag tone="success">● Aktiv</Tag>}
                  </td>
                  <td style={{ textAlign: 'right' }} className="tnum">{c.raised ? kr(c.raised) : '—'}</td>
                  <td style={{ textAlign: 'right' }} className="tnum">{c.donors || '—'}</td>
                  <td style={{ textAlign: 'right' }} className="f-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.daysLeft}</td>
                  <td style={{ textAlign: 'right' }}><Icon name="chevron-right" size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// WIZARD — 5-step create-fundraiser
// ============================================================
function WizardScreen({ onNav }) {
  const [step, setStep] = useStateA(1);
  const steps = [
    { num: 1, name: 'Identitet',  desc: 'BankID + grundinfo' },
    { num: 2, name: 'Mottagare',  desc: 'Vem får pengarna' },
    { num: 3, name: 'Mål & budget', desc: 'Belopp, dagar, uppdelning' },
    { num: 4, name: 'Story & media', desc: 'Titel, text, bilder' },
    { num: 5, name: 'Skicka in',  desc: 'Granskare tar emot' },
  ];

  return (
    <div className="studio" style={{ background: 'var(--paper-soft)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 56px 80px' }}>
        <button onClick={() => onNav('account')} style={{ background: 'none', border: 0, color: 'var(--ink-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 20 }}>
          <Icon name="arrow-left" size={14} /> Tillbaka till mina sidor
        </button>
        <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>SKAPA INSAMLING · STEG {step} AV 5</div>
        <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56 }}>{steps[step-1].name}.</h1>

        {/* Stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, marginTop: 40, marginBottom: 48, borderTop: '1px solid var(--ink)' }}>
          {steps.map(s => (
            <button key={s.num} onClick={() => setStep(s.num)}
                    style={{ background: 'none', border: 0, padding: '20px 16px 18px', cursor: 'pointer', borderTop: s.num === step ? '2px solid var(--accent)' : 'none', marginTop: -1, textAlign: 'left', borderRight: s.num < 5 ? '1px solid var(--line)' : 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 24, height: 24, borderRadius: 2, background: s.num < step ? 'var(--success)' : s.num === step ? 'var(--accent)' : '#fff', border: '1px solid ' + (s.num <= step ? 'transparent' : 'var(--line)'), color: s.num <= step ? '#fff' : 'var(--ink-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {s.num < step ? '✓' : s.num}
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: s.num === step ? 700 : 500, color: s.num === step ? 'var(--ink)' : 'var(--ink-2)' }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 48 }}>
          {/* Form panel */}
          <div style={{ background: '#fff', border: '1px solid var(--ink)', padding: 40 }}>
            {step === 1 && (
              <div>
                <h3 className="mag-h2" style={{ marginBottom: 8, fontSize: 28 }}>Vem är du?</h3>
                <p className="mag-lead" style={{ marginBottom: 28 }}>Vi verifierar med BankID. Bara förnamn syns publikt.</p>
                <div style={{ padding: 18, background: 'rgba(45,107,79,0.08)', border: '1px solid var(--success)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <span style={{ width: 32, height: 32, background: 'var(--success)', color: '#fff', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                  <div>
                    <strong style={{ fontSize: 14.5 }}>BankID verifierad — Yasmin Adan</strong>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>Verifierad 18 maj 2026 · 941223-XXXX</div>
                  </div>
                </div>
                <Field label="Insamlarens publika namn" sub="Hur du vill visas på sidan">
                  <input defaultValue="Yasmin Adan" style={inp} />
                </Field>
                <Field label="Stad">
                  <input defaultValue="Stockholm" style={inp} />
                </Field>
                <Field label="Tidigare erfarenhet (frivilligt)" sub="Korta meningar — granskaren läser. Inte publikt.">
                  <textarea rows={3} defaultValue="Drivit 8 insamlingar sedan 2024, alla med komplett transparens. Senast brunn i Etiopien (komplett bevis)." style={{ ...inp, height: 'auto', padding: 14, resize: 'vertical', fontFamily: 'var(--font-ui)' }} />
                </Field>
              </div>
            )}
            {step === 2 && (
              <div>
                <h3 className="mag-h2" style={{ marginBottom: 8, fontSize: 28 }}>Vem får pengarna?</h3>
                <p className="mag-lead" style={{ marginBottom: 28 }}>Direkt-utbetalning via Stripe Connect. Du måste ange en mottagare med organisationsnummer eller ett verifierat samarbete.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <RadioCard label="Anslutet förening" sub="Hjälpkraft Sverige · 802534-1234" selected />
                  <RadioCard label="Ny förening" sub="Lägg till en mottagare" />
                </div>
                <Field label="Utförare på plats" sub="Vem som faktiskt gör jobbet">
                  <input defaultValue="Wells of Hope Mali" style={inp} />
                </Field>
                <Field label="Hur når pengarna mottagaren?" sub="Stripe-utbetalning, manuell överföring, hawala etc.">
                  <input defaultValue="Stripe Connect → Hjälpkraft Sverige → bankgiro till Mali partner" style={inp} />
                </Field>
              </div>
            )}
            {step === 3 && (
              <div>
                <h3 className="mag-h2" style={{ marginBottom: 8, fontSize: 28 }}>Mål och budget</h3>
                <p className="mag-lead" style={{ marginBottom: 28 }}>Var konkret. Granskaren vill se hur du har räknat.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <Field label="Mål (kr)">
                    <input defaultValue="200 000" style={inp} />
                  </Field>
                  <Field label="Dagar aktiv">
                    <input defaultValue="60" style={inp} />
                  </Field>
                </div>
                <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 10 }}>BUDGETUPPDELNING</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  {[
                    ['Borrning + djupundersökning', '92 000'],
                    ['Betongring + pumpinstallation', '46 000'],
                    ['Utbildning två tekniker', '18 000'],
                    ['Transport + logistik', '14 000'],
                    ['Marginal + oförutsett', '10 000'],
                  ].map(([n, v], i) => (
                    <tr key={i}>
                      <td style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}><input defaultValue={n} style={{ ...inp, height: 38, border: 0, padding: '0 4px' }} /></td>
                      <td style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', width: 140 }}><input defaultValue={v} style={{ ...inp, height: 38, border: 0, padding: '0 4px', textAlign: 'right' }} /></td>
                    </tr>
                  ))}
                </table>
                <Btn variant="ghost" size="sm">+ Lägg till rad</Btn>
              </div>
            )}
            {step === 4 && (
              <div>
                <h3 className="mag-h2" style={{ marginBottom: 8, fontSize: 28 }}>Story och bilder</h3>
                <p className="mag-lead" style={{ marginBottom: 28 }}>Skriv som om du berättade för en granne. Inga superlativ.</p>
                <Field label="Titel" sub="Max 80 tecken">
                  <input defaultValue="En brunn för byn Diabaly — 280 personer får rent vatten" style={inp} />
                </Field>
                <Field label="Kategori">
                  <select style={inp}><option>Vatten</option><option>Mat</option></select>
                </Field>
                <Field label="Story" sub="Vad är problemet, vad är lösningen, varför just du?">
                  <textarea rows={6} placeholder="Byn Diabaly i centrala Mali har 280 invånare…" style={{ ...inp, height: 'auto', padding: 14, resize: 'vertical', fontFamily: 'var(--font-ui)', lineHeight: 1.55 }} />
                </Field>
                <Field label="Bilder" sub="Minst 3, max 10. JPG eller PNG, max 5 MB var.">
                  <div style={{ border: '2px dashed var(--line)', padding: 32, textAlign: 'center', borderRadius: 4 }}>
                    <Icon name="package" size={32} />
                    <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)' }}>Dra och släpp bilder här, eller <a style={{ color: 'var(--accent-deep)', textDecoration: 'underline', cursor: 'pointer' }}>välj filer</a></div>
                  </div>
                </Field>
              </div>
            )}
            {step === 5 && (
              <div>
                <h3 className="mag-h2" style={{ marginBottom: 8, fontSize: 28 }}>Skicka till granskning</h3>
                <p className="mag-lead" style={{ marginBottom: 28 }}>En granskare läser inom 48h. Du får ett mejl med beslut.</p>
                <div style={{ padding: 20, background: 'var(--paper-soft)', border: '1px solid var(--line)', borderRadius: 4, marginBottom: 24 }}>
                  <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', marginBottom: 12 }}>SAMMANFATTNING</div>
                  {[
                    ['Titel', 'En brunn för byn Diabaly — 280 personer får rent vatten'],
                    ['Mål',   '200 000 kr · 60 dgr'],
                    ['Mottagare', 'Hjälpkraft Sverige → Wells of Hope Mali'],
                    ['Kategori', 'Vatten · Mali'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 14 }}>
                      <span style={{ width: 140, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.06em' }}>{k.toUpperCase()}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer', marginBottom: 24 }}>
                  <input type="checkbox" defaultChecked style={{ marginTop: 3 }} />
                  <div style={{ fontSize: 14 }}>Jag intygar att uppgifterna är riktiga och att jag följer Sadaqa Swedens plattformsregler. Jag förstår att fel uppgifter kan leda till avslag och konton-stängning.</div>
                </label>
                <Btn variant="primary" size="lg" block onClick={() => onNav('account')}>Skicka in till granskning →</Btn>
              </div>
            )}

            {/* Step controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
              <Btn variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>← Föregående</Btn>
              {step < 5 && <Btn variant="primary" onClick={() => setStep(Math.min(5, step + 1))}>Fortsätt →</Btn>}
            </div>
          </div>

          {/* Side panel: tips */}
          <aside>
            <div style={{ padding: 24, background: 'var(--forest-deep)', color: 'var(--paper)', borderRadius: 4 }}>
              <div className="f-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--copper-warm)', marginBottom: 12 }}>VAD GRANSKAREN TITTAR PÅ</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  ['I',   'Är avsikten ärlig?', 'BankID + tidigare projekt'],
                  ['II',  'Är mottagaren klar?', 'Org.nr eller verifierad partner'],
                  ['III', 'Är leveransen sannolik?', 'Budget rimlig? Plan B om bara halva?'],
                ].map(([n, t, b]) => (
                  <li key={n} style={{ padding: '12px 0', borderBottom: '1px solid rgba(245,240,228,0.10)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span className="f-mono" style={{ fontSize: 14, color: 'var(--copper-warm)' }}>{n}</span>
                      <strong style={{ fontSize: 14 }}>{t}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(245,240,228,0.6)', marginTop: 4 }}>{b}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: 16, padding: 20, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4 }}>
              <div className="f-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--ink-3)', marginBottom: 8 }}>BEHÖVER DU HJÄLP?</div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-1)', margin: 0 }}>Ring eller skriv. Vi har en granskare i beredskap.</p>
              <Btn variant="ghost" size="sm" style={{ marginTop: 10, padding: 0 }}>Öppna chatt →</Btn>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', height: 48, padding: '0 14px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 14.5, fontFamily: 'var(--font-ui)', background: '#fff' };

function Field({ label, sub, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', marginBottom: sub ? 2 : 6 }}>{label}</label>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>{sub}</div>}
      {children}
    </div>
  );
}

function RadioCard({ label, sub, selected }) {
  return (
    <button style={{ padding: 16, border: '1px solid ' + (selected ? 'var(--ink)' : 'var(--line)'), background: selected ? 'rgba(14,20,17,0.04)' : '#fff', cursor: 'pointer', textAlign: 'left', borderRadius: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + (selected ? 'var(--accent)' : 'var(--line)'), background: selected ? 'var(--accent)' : 'transparent', boxShadow: selected ? 'inset 0 0 0 3px #fff' : 'none' }} />
        <strong style={{ fontSize: 14 }}>{label}</strong>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6, marginLeft: 26 }}>{sub}</div>
    </button>
  );
}

// ============================================================
// UPDATE — transparency update
// ============================================================
function UpdateScreen({ onNav }) {
  const [type, setType] = useStateA('proof');
  return (
    <div className="studio" style={{ background: 'var(--paper-soft)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 56px 80px' }}>
        <button onClick={() => onNav('account')} style={{ background: 'none', border: 0, color: 'var(--ink-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 20 }}>
          <Icon name="arrow-left" size={14} /> Tillbaka
        </button>
        <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>TRANSPARENS · UPPDATERING</div>
        <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56 }}>Vad har hänt?</h1>
        <p className="mag-lead" style={{ marginTop: 12, maxWidth: 600 }}>Donatorerna får mejl när du postar. Bilder, dokument, ord — vad som faktiskt skedde.</p>

        <div style={{ marginTop: 36, background: '#fff', border: '1px solid var(--ink)', padding: 40 }}>
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 12 }}>TYP AV UPPDATERING</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 24 }}>
            {[
              { id: 'proof', label: 'Bevis', desc: 'Pengar har gått ut' },
              { id: 'status', label: 'Status', desc: 'Lägesrapport' },
              { id: 'result', label: 'Resultat', desc: 'Det är klart' },
              { id: 'issue', label: 'Hinder', desc: 'Något försenas' },
            ].map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                      style={{ padding: 14, border: '1px solid ' + (type === t.id ? 'var(--ink)' : 'var(--line)'), background: type === t.id ? 'var(--ink)' : '#fff', color: type === t.id ? 'var(--paper)' : 'var(--ink-1)', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 3 }}>{t.desc}</div>
              </button>
            ))}
          </div>

          <Field label="Vilken insamling?" sub="Endast aktiva projekt syns här">
            <select style={inp}>
              <option>En brunn för byn Diabaly</option>
            </select>
          </Field>
          <Field label="Rubrik" sub="Kort och konkret">
            <input placeholder="T.ex. 'Borrtillstånd godkänt'" style={inp} />
          </Field>
          <Field label="Vad hände?" sub="Som om du berättade för en vän. Inga superlativ.">
            <textarea rows={5} placeholder="Tillståndet kom in idag. Borrlag bokat för vecka 26…" style={{ ...inp, height: 'auto', padding: 14, resize: 'vertical', fontFamily: 'var(--font-ui)', lineHeight: 1.55 }} />
          </Field>
          <Field label="Bevis (bilder + dokument)" sub="Minst 1 obligatorisk för typ 'Bevis' och 'Resultat'">
            <div style={{ border: '2px dashed var(--line)', padding: 28, textAlign: 'center', borderRadius: 4 }}>
              <Icon name="package" size={28} />
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-2)' }}>Dra och släpp eller <a style={{ color: 'var(--accent-deep)', textDecoration: 'underline', cursor: 'pointer' }}>välj filer</a></div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>JPG / PNG / PDF · max 10 MB</div>
            </div>
          </Field>
          {type === 'proof' && (
            <Field label="Belopp utbetalat (kr)" sub="Måste matcha kvittot/dokumentet">
              <input placeholder="50 000" style={inp} />
            </Field>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)', gap: 12 }}>
            <Btn variant="ghost">Spara som utkast</Btn>
            <Btn variant="primary" onClick={() => onNav('fundraiser')}>Publicera uppdatering →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AccountScreen, WizardScreen, UpdateScreen, Field });
