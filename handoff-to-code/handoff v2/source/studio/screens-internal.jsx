// ============================================================
// SADAQA STUDIO — INTERNAL + WORLD SCREENS
// Admin · Review · Team · Map · Community · Audit · System
// ============================================================

const { useState: useStateI, useMemo: useMemoI } = React;
const DI = window.STUDIO_DATA;

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminScreen({ onNav }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 24 }}>
        <div>
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>MASKINRUM · DASHBOARD · 24 MAJ 2026 16:42</div>
          <h1 className="mag-h1" style={{ marginTop: 10, fontSize: 44 }}>Plattformsöversikt</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm"><Icon name="external" size={14} /> Exportera rapport</Btn>
          <Btn variant="secondary" size="sm">Filter: idag ↓</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div className="dash-kpi-row">
        <div className="dash-kpi">
          <span className="label">SAMLAT IDAG</span>
          <span className="figure tnum">142 800 kr</span>
          <span className="sub" style={{ color: 'var(--success)' }}>↑ 28% mot snittdag</span>
        </div>
        <div className="dash-kpi">
          <span className="label">AKTIVA PROJEKT</span>
          <span className="figure tnum">142</span>
          <span className="sub">12 publicerade senaste 7 dgr</span>
        </div>
        <div className="dash-kpi">
          <span className="label">VÄNTAR PÅ GRANSKNING</span>
          <span className="figure tnum">3</span>
          <span className="sub" style={{ color: 'var(--danger)' }}>1 över 48h-gräns</span>
        </div>
        <div className="dash-kpi">
          <span className="label">STRIPE-BALANS</span>
          <span className="figure tnum">0 kr</span>
          <span className="sub">100% till mottagare · OK</span>
        </div>
      </div>

      {/* Two-col: live activity + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginTop: 24 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <h3 className="mag-h3">Donationer · senaste timmarna</h3>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>LIVE</span>
          </div>
          {/* Simple bar chart */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2, alignItems: 'end', height: 120 }}>
            {[8, 12, 6, 4, 3, 2, 1, 0, 2, 4, 8, 14, 22, 28, 24, 32, 38, 42, 50, 48, 42, 36, 28, 22].map((v, i) => (
              <div key={i} style={{ height: `${v * 2}px`, background: i >= 18 ? 'var(--accent)' : 'var(--forest)', borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NU</span>
          </div>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <h4 className="mag-h3" style={{ fontSize: 18, marginBottom: 12 }}>Senaste donationerna</h4>
            {[
              ['16:38', 'Anonym',    '500 kr',  'Diabaly-brunnen'],
              ['16:31', 'Mohamed K.', '200 kr', 'Iftar Malmö'],
              ['16:24', 'Amina S.',   '1 000 kr', 'Diabaly-brunnen'],
              ['16:11', 'Anonym',     '50 kr',  'Vinterhjälp Syrien'],
              ['16:02', 'Ibrahim N.', '300 kr', 'Nödtält-skola Gaza'],
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px 1.4fr', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--line)' : 0, fontSize: 13.5, alignItems: 'center' }}>
                <span className="f-mono" style={{ color: 'var(--ink-3)', fontSize: 11.5 }}>{row[0]}</span>
                <span>{row[1]}</span>
                <span className="tnum" style={{ fontWeight: 600 }}>{row[2]}</span>
                <span style={{ color: 'var(--ink-2)' }}>→ {row[3]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid var(--danger)', borderRadius: 6, padding: 18 }}>
            <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--danger)', letterSpacing: '0.16em', marginBottom: 8 }}>⚠ KRITISK · 1</div>
            <strong style={{ fontSize: 15 }}>"Föräldralösa Jemen" — bevis försenat 32 dgr</strong>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, marginBottom: 12 }}>Insamlare Yasmin Adan har inte postat utbetalningsbevis. Pengar är ute. Donatorer börjar fråga.</p>
            <Btn variant="primary" size="sm" onClick={() => onNav('review')}>Öppna ärende →</Btn>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: 18 }}>
            <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--accent-deep)', letterSpacing: '0.16em', marginBottom: 8 }}>● 3 VÄNTAR PÅ GRANSKNING</div>
            <strong style={{ fontSize: 15 }}>Granskningskön</strong>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, marginBottom: 12 }}>1 ärende över 48h-gränsen. Tilldela en granskare.</p>
            <Btn variant="primary" size="sm" onClick={() => onNav('review')}>Öppna kö →</Btn>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: 18 }}>
            <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.16em', marginBottom: 8 }}>SYSTEM</div>
            {[
              ['Stripe', 'OK', 'green'],
              ['BankID', 'OK', 'green'],
              ['Supabase', 'OK', 'green'],
              ['Mail-utskick', 'Långsam', 'yellow'],
            ].map(([n, v, c]) => (
              <div key={n} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span>{n}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: c === 'green' ? 'var(--success)' : 'var(--copper)' }} /> {v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom rows: top campaigns + recent users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 32 }}>
        <div>
          <h3 className="mag-h3" style={{ marginBottom: 14 }}>Topp-insamlingar idag</h3>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Insamling</th>
                <th>Kategori</th>
                <th style={{ textAlign: 'right' }}>Idag</th>
                <th style={{ textAlign: 'right' }}>Donatörer</th>
              </tr>
            </thead>
            <tbody>
              {DI.campaigns.slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td><strong>{c.title.length > 40 ? c.title.slice(0, 40) + '…' : c.title}</strong></td>
                  <td style={{ color: 'var(--ink-3)' }}>{c.category}</td>
                  <td className="tnum" style={{ textAlign: 'right', fontWeight: 600 }}>{kr((c.donors * 200) % 50000 + 5000)}</td>
                  <td className="tnum" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{(c.donors % 30) + 2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="mag-h3" style={{ marginBottom: 14 }}>Nya registreringar</h3>
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6 }}>
            {[
              ['Ali Hassan', 'Donator', '16:14', 'BankID', 'green'],
              ['Sara Khan', 'Insamlare', '15:52', 'BankID', 'green'],
              ['Anonym', 'Donator', '15:31', 'E-post', 'yellow'],
              ['Tensta IC', 'Förening', '14:08', 'Ansökan', 'yellow'],
              ['Omar Salah', 'Insamlare', '13:21', 'BankID', 'green'],
            ].map(([n, t, ts, v, c], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 12, padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--line)' : 0, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 2, background: 'var(--forest-soft)', color: 'var(--forest)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{n.split(' ').map(s => s[0]).join('')}</div>
                <div>
                  <strong style={{ fontSize: 13.5 }}>{n}</strong>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t} · {ts}</div>
                </div>
                <Tag tone={c === 'green' ? 'success' : 'accent'}>{v}</Tag>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REVIEW — granskning queue
// ============================================================
function ReviewScreen({ onNav }) {
  const [sel, setSel] = useStateI('q1');
  const queue = [
    { id: 'q1', title: 'En brunn för byn Massala — 240 personer', who: 'Yasmin Adan', city: 'Stockholm', cat: 'Vatten · Mali', goal: 200000, age: '14 tim', risk: 'low', collab: 'Hjälpkraft' },
    { id: 'q2', title: 'Vintertält Idlib 2026 — andra omgång', who: 'Ahmad Khalil', city: 'Uppsala', cat: 'Akut · Syrien', goal: 180000, age: '38 tim', risk: 'medium', collab: 'Syriahjälpen' },
    { id: 'q3', title: 'Privat sjukvårdskostnad — anonym', who: 'Privat insamlare', city: '—', cat: 'Sjukvård', goal: 85000, age: '52 tim', risk: 'high', collab: null, flag: true },
  ];
  const current = queue.find(q => q.id === sel);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 24 }}>
        <div>
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>MASKINRUM · GRANSKNING · 3 I KÖ</div>
          <h1 className="mag-h1" style={{ marginTop: 10, fontSize: 44 }}>Granskningskön</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" size="sm">Filter: Alla</Btn>
          <Btn variant="ghost" size="sm">Tilldela: Mig ↓</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Queue */}
        <div>
          <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 8 }}>I KÖ ({queue.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {queue.map(q => (
              <button key={q.id} onClick={() => setSel(q.id)}
                      style={{ padding: 14, border: '1px solid ' + (sel === q.id ? 'var(--ink)' : 'var(--line)'), background: sel === q.id ? '#fff' : 'var(--paper-soft)', cursor: 'pointer', textAlign: 'left', borderRadius: 4, position: 'relative' }}>
                {sel === q.id && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>#{q.id.toUpperCase()} · {q.age}</span>
                  {q.risk === 'high' && <Tag tone="danger">⚠ Hög risk</Tag>}
                  {q.risk === 'medium' && <Tag tone="accent">! Medel</Tag>}
                  {q.risk === 'low' && <Tag tone="success">● Låg</Tag>}
                </div>
                <strong style={{ fontSize: 14, lineHeight: 1.3, display: 'block' }}>{q.title}</strong>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>{q.who} · {q.cat}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.10em' }}>#{current.id.toUpperCase()} · {current.cat.toUpperCase()}</div>
              <h2 className="mag-h2" style={{ marginTop: 6, fontSize: 28 }}>{current.title}</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>Av <strong>{current.who}</strong> · {current.city} · Mål {kr(current.goal)} · I kö {current.age}</p>
            </div>
            {current.risk === 'high' && <Tag tone="danger">⚠ Hög risk</Tag>}
          </div>

          {/* Principles */}
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginTop: 28, marginBottom: 14 }}>BEDÖM TRE PRINCIPER</div>
          {[
            { num: 'I', name: 'Ärlig avsikt', body: current.who === 'Privat insamlare' ? 'Insamlaren är ANONYM. BankID saknas. Det här är ett första-projekt utan historia. Stora frågetecken.' : (current.who === 'Yasmin Adan' ? 'Yasmin är BankID-verifierad. 8 tidigare projekt, alla med bevis. Risk: låg.' : 'Ahmad har genomfört en tidigare insamling med komplett bevis. BankID-verifierad.') },
            { num: 'II', name: 'Klar mottagare', body: current.collab ? `Partner: ${current.collab}. Registrerad svensk ideell förening med org.nr.` : 'Ingen registrerad partner. Insamlaren vill ta emot pengarna privat — kräver särskild prövning.' },
            { num: 'III', name: 'Sannolik leverans', body: current.cat.includes('Mali') ? 'Brunn 2 i grannbyn Massala. Wells of Hope har redan byggt 14 brunnar i regionen. Budget matchar marknad.' : (current.cat.includes('Syrien') ? 'Idlib är aktiv konfliktzon — leveransrisk högre. Plan B-beskrivning saknas.' : 'Sjukvårdskostnader saknar specifika kvitton eller behandlingsplan.') },
          ].map(p => (
            <div key={p.num} style={{ padding: '18px 0', borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '40px 1fr 240px', gap: 20, alignItems: 'flex-start' }}>
              <div className="f-mono" style={{ fontSize: 28, color: 'var(--accent-deep)', fontWeight: 300, lineHeight: 1 }}>{p.num}</div>
              <div>
                <h4 className="mag-h3" style={{ fontSize: 17, marginBottom: 6 }}>{p.name}</h4>
                <p style={{ fontSize: 14.5, color: 'var(--ink-1)', lineHeight: 1.55, margin: 0 }}>{p.body}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                <button style={{ padding: '10px 6px', border: '1px solid var(--success)', background: 'transparent', color: 'var(--success)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, borderRadius: 4 }}>✓ OK</button>
                <button style={{ padding: '10px 6px', border: '1px solid var(--copper)', background: 'transparent', color: 'var(--copper-deep)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, borderRadius: 4 }}>? Fråga</button>
                <button style={{ padding: '10px 6px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, borderRadius: 4 }}>✗ Avslå</button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 24, padding: 16, background: 'var(--paper-soft)', borderRadius: 4 }}>
            <label style={{ fontSize: 12.5, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Granskar-anteckning (intern)</label>
            <textarea rows={3} placeholder="Skäl till beslut, frågor till insamlaren, observationer…"
                      style={{ width: '100%', padding: 12, border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'var(--font-ui)', fontSize: 14, resize: 'vertical', background: '#fff' }} />
          </div>

          {/* Decision row */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--ink)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <Btn variant="ghost">Spara utan beslut</Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary">Ställ frågor → insamlare</Btn>
              <Btn variant="primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Avslå</Btn>
              <Btn variant="primary" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>✓ Godkänn & publicera</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TEAM — workspace
// ============================================================
function TeamScreen({ onNav }) {
  return (
    <div>
      <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>MASKINRUM · TEAM · 6 PERSONER</div>
      <h1 className="mag-h1" style={{ marginTop: 10, fontSize: 44, marginBottom: 32 }}>Arbetsyta</h1>

      {/* Team grid */}
      <div className="mag" style={{ gap: '16px var(--col-gap)' }}>
        {[
          { name: 'Yasmin Adan',  init: 'YA', role: 'Admin · grundare',     pres: 'online',   tasks: 4, city: 'Stockholm' },
          { name: 'Imran Sayed',  init: 'IS', role: 'Granskare · grundare', pres: 'online',   tasks: 3, city: 'Stockholm' },
          { name: 'Aisha Rahim',  init: 'AR', role: 'Granskare',            pres: 'online',   tasks: 2, city: 'Göteborg' },
          { name: 'Mahmood Sahin', init: 'MS', role: 'Community-mod',       pres: 'away',     tasks: 1, city: 'Malmö' },
          { name: 'Layla M.',     init: 'LM', role: 'Föreningsansvarig',    pres: 'offline',  tasks: 0, city: 'Uppsala' },
          { name: 'Hassan O.',    init: 'HO', role: 'Tech · insynar',       pres: 'online',   tasks: 6, city: 'Stockholm' },
        ].map(m => (
          <div key={m.name} className="mag-col-4">
            <div style={{ padding: 20, background: '#fff', border: '1px solid var(--line)', borderRadius: 6 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 4, background: 'var(--forest)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, position: 'relative' }}>
                  {m.init}
                  <span style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: m.pres === 'online' ? 'var(--success)' : (m.pres === 'away' ? 'var(--copper)' : 'var(--ink-4)'), border: '2px solid #fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>{m.name}</strong>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{m.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', fontSize: 12.5, color: 'var(--ink-3)' }}>
                <span>{m.city}</span>
                <span><strong style={{ color: m.tasks > 4 ? 'var(--danger)' : 'var(--ink)' }}>{m.tasks}</strong> öppna</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Shared todo */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 className="mag-h3">Gemensam todo</h3>
          <Btn variant="ghost" size="sm"><Icon name="plus" size={14} /> Ny uppgift</Btn>
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>Uppgift</th>
              <th>Ansvarig</th>
              <th>Frist</th>
              <th>Prio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Granska "Föräldralösa Jemen" — bevis försenat', 'Imran S.', 'Idag', 'Hög', 'critical'],
              ['Skicka mejl till Hjälpkraft om Stripe-uppdatering', 'Yasmin A.', '26 maj', 'Medel'],
              ['Rensa community-tråd "Sadaqa Jariya"', 'Mahmood S.', '27 maj', 'Låg'],
              ['Beredskapsplan — uppdatera scenario 3', 'Hassan O.', '02 jun', 'Medel'],
              ['Föreningskontrakt — Rinkeby IC', 'Layla M.', '08 jun', 'Medel'],
              ['Tarawih-event live-stream test', 'Aisha R.', '14 jun', 'Hög'],
            ].map((row, i) => (
              <tr key={i}>
                <td><input type="checkbox" style={{ accentColor: 'var(--accent)' }} /></td>
                <td><strong>{row[0]}</strong></td>
                <td style={{ color: 'var(--ink-2)' }}>{row[1]}</td>
                <td className="f-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{row[2]}</td>
                <td><Tag tone={row[3] === 'Hög' ? 'danger' : row[3] === 'Medel' ? 'accent' : 'outline'}>{row[3]}</Tag></td>
                <td style={{ textAlign: 'right' }}><Btn variant="ghost" size="sm">Öppna →</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// MAP — Sweden silhouette + city dots (placeholder; real map = Leaflet + OpenFreeMap later)
// ============================================================
function MapScreen({ onNav }) {
  const [selCity, setSelCity] = useStateI(null);
  const [layer, setLayer] = useStateI('lan');
  return (
    <div className="studio">
      <section style={{ padding: '40px 0 0' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ KARTA · 142 INSAMLINGAR · 27 STÄDER</div>
          <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56 }}>Var pengarna kommer från — och vart hjälpen går.</h1>
          <p className="mag-lead" style={{ marginTop: 16, maxWidth: 640 }}>Klicka på en stad / län för att se de pågående insamlingarna där.</p>

          {/* KPI row above map */}
          <div className="dash-kpi-row" style={{ marginTop: 40 }}>
            <div className="dash-kpi">
              <span className="label">AKTIVA INSAMLINGAR</span>
              <span className="figure tnum">142</span>
            </div>
            <div className="dash-kpi">
              <span className="label">LEVERERADE</span>
              <span className="figure tnum">98</span>
            </div>
            <div className="dash-kpi">
              <span className="label">VERIFIERADE INSAMLARE</span>
              <span className="figure tnum">214</span>
            </div>
            <div className="dash-kpi">
              <span className="label">INSAMLAT TOTALT</span>
              <span className="figure tnum">8,4 mkr</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 24px' }}>
        <div className="mag-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
            {/* Map */}
            <div style={{ background: 'var(--forest-deep)', padding: 24, borderRadius: 6, position: 'relative', minHeight: 560 }}>
              {/* Layer chips */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'rgba(245,240,228,0.08)', borderRadius: 999, padding: 3 }}>
                  {['lan', 'kommun', 'hjalp'].map(k => (
                    <button key={k} onClick={() => setLayer(k)}
                            style={{ padding: '6px 14px', borderRadius: 999, border: 0, background: layer === k ? 'var(--paper)' : 'transparent', color: layer === k ? 'var(--ink)' : 'rgba(245,240,228,0.7)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      {k === 'lan' ? 'Län' : k === 'kommun' ? 'Kommun' : 'Hjälp-vy'}
                    </button>
                  ))}
                </div>
                <button style={{ padding: '6px 14px', borderRadius: 999, border: 0, background: 'var(--paper)', color: 'var(--ink)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Visa events</button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(245,240,228,0.45)' }}>Placeholder · riktig karta = Leaflet + OpenFreeMap</span>
              </div>
              <svg viewBox="0 0 100 110" style={{ width: '100%', maxHeight: 480 }}>
                <path d="M 64 4 Q 70 8 72 14 Q 74 22 70 28 Q 72 36 68 42 Q 72 48 64 54 Q 70 60 60 66 Q 64 70 56 76 Q 58 82 48 84 Q 46 90 38 92 Q 36 96 28 96 Q 30 90 28 86 Q 24 80 30 72 Q 26 64 36 56 Q 30 48 40 42 Q 36 36 44 28 Q 40 20 50 14 Q 54 8 58 6 Z" fill="rgba(245,240,228,0.06)" stroke="rgba(245,240,228,0.18)" strokeWidth="0.2" />
                <g stroke="rgba(245,240,228,0.08)" strokeWidth="0.15" fill="none">
                  {[20,40,60,80,100].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} />)}
                </g>
                {DI.cities.map(c => {
                  const r = Math.max(1.4, Math.sqrt(c.campaigns) * 0.6);
                  return (
                    <g key={c.name} style={{ cursor: 'pointer' }} onClick={() => setSelCity(c.name)}>
                      <circle cx={c.x} cy={c.y} r={r + 2} fill="var(--copper)" opacity={selCity === c.name ? 0.5 : 0.25} />
                      <circle cx={c.x} cy={c.y} r={r} fill="var(--copper)" />
                      <text x={c.x + r + 1} y={c.y + 1} fontSize="2.6" fill={selCity === c.name ? 'var(--paper)' : 'rgba(245,240,228,0.7)'} fontFamily="var(--font-mono)" letterSpacing="0.05em">{c.name} · {c.campaigns}</text>
                    </g>
                  );
                })}
              </svg>
              <div style={{ fontSize: 10.5, color: 'rgba(245,240,228,0.4)', marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(245,240,228,0.10)', lineHeight: 1.5 }}>
                Aggregat uppdateras var 6:e timme. Bara län/kommuner med minst 5 insamlingar visar siffror på kommunnivå (k-anonymitet).
              </div>
            </div>

            {/* Side panel */}
            <div>
              {selCity ? (
                <div>
                  <button onClick={() => setSelCity(null)} style={{ background: 'none', border: 0, color: 'var(--accent-deep)', cursor: 'pointer', fontSize: 13, marginBottom: 18, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="arrow-left" size={12} /> Tillbaka till hela Sverige
                  </button>
                  <h2 className="mag-h1" style={{ fontSize: 48 }}>{selCity}</h2>
                  <p className="mag-lead" style={{ marginTop: 12 }}>{DI.cities.find(c => c.name === selCity)?.campaigns} aktiva · {DI.cities.find(c => c.name === selCity)?.raised} totalt insamlat.</p>
                  <div style={{ marginTop: 24 }}>
                    {DI.campaigns.filter(c => c.city === selCity).map(c => <CampaignCard key={c.id} campaign={c} onNav={onNav} compact />)}
                    {DI.campaigns.filter(c => c.city === selCity).length === 0 && (
                      <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>Inga insamlingar visas i demon för {selCity}.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: 24, background: '#fff', border: '1px solid var(--line)', borderRadius: 6 }}>
                    <h3 className="mag-h3" style={{ fontSize: 22 }}>Topplista</h3>
                    <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, marginBottom: 14 }}>Aktiva insamlingar per {layer === 'lan' ? 'län' : 'stad'}.</p>
                    {DI.cities.slice(0, 10).map((c, i) => (
                      <button key={c.name} onClick={() => setSelCity(c.name)}
                              style={{ width: '100%', background: 'none', border: 0, borderTop: i > 0 ? '1px solid var(--line)' : 0, padding: '12px 0', display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 16, cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                        <span className="f-mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{i + 1}.</span>
                        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{c.name}</span>
                        <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{c.campaigns}</span>
                        <span className="tnum" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{c.raised}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: 22, background: 'var(--forest-deep)', color: 'var(--paper)', borderRadius: 6 }}>
                    <h3 className="mag-h3" style={{ color: 'var(--paper)', fontSize: 22 }}>Vill du starta något här?</h3>
                    <p style={{ fontSize: 13.5, color: 'rgba(245,240,228,0.7)', marginTop: 8, lineHeight: 1.5 }}>Saknar din region engagemang? Bli först — varje insamling börjar med en person som ser ett behov.</p>
                    <Btn variant="onforest" size="sm" onClick={() => onNav('wizard')} style={{ marginTop: 14 }}>Starta en insamling</Btn>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attribution */}
          <div style={{ marginTop: 32, fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 900 }}>
            Bakgrundskarta © OpenStreetMap-bidragsgivare via OpenFreeMap. Län/kommun-data från Lantmäteriet / SCB öppna data. Endast BankID-/identitetsverifierade insamlare i tillstånd <em>aktiv</em> eller senare räknas i aggregatet.
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// COMMUNITY — threads + events
// ============================================================
function CommunityScreen({ onNav }) {
  const [tab, setTab] = useStateI('threads');
  const [duaCount, setDuaCount] = useStateI({});
  const doDua = (id) => setDuaCount({ ...duaCount, [id]: (duaCount[id] || 0) + 1 });

  return (
    <div className="studio">
      <section style={{ padding: '40px 0 0' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ COMMUNITY</div>
          <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56 }}>Samtal, frågor, händelser — runt det vi gör.</h1>
          <p className="mag-lead" style={{ marginTop: 16, maxWidth: 640 }}>Inte Facebook. Strukturerade samtal kopplade till insamlingar, föreningar och plattformen. Dua-knapp finns — för att räkna närvaron.</p>

          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ink)', marginTop: 32 }}>
            {[
              { id: 'threads', label: 'Samtal', count: DI.threads.length },
              { id: 'events',  label: 'Händelser', count: DI.events.length },
              { id: 'mosques', label: 'Moskéer & föreningar', count: 36 },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      style={{ background: 'none', border: 0, padding: '14px 20px', cursor: 'pointer', borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'), marginBottom: -1, fontFamily: 'var(--font-ui)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14.5, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)' }}>{t.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 0 96px' }}>
        <div className="mag-container">
          {tab === 'threads' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 56 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Btn variant="primary" size="sm">+ Nytt samtal</Btn>
                  <select style={{ height: 36, padding: '0 12px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}><option>Sortera: Aktiva</option><option>Mest dua</option><option>Nyaste</option></select>
                </div>
                <div style={{ borderTop: '1px solid var(--ink)' }}>
                  {DI.threads.map(t => (
                    <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 80px 80px', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--forest-soft)', color: 'var(--forest)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{t.author.split(' ').map(s => s[0]).join('')}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <Tag tone="outline">{t.tag}</Tag>
                          {t.hot && <Tag tone="accent">● Het</Tag>}
                        </div>
                        <h4 className="mag-h3" style={{ fontSize: 18, fontWeight: 500 }}>{t.title}</h4>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>av {t.author} · {t.city}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div className="tnum" style={{ fontSize: 17, fontWeight: 600 }}>{t.replies}</div>
                        <div className="f-mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>SVAR</div>
                      </div>
                      <button onClick={() => doDua(t.id)} style={{ textAlign: 'center', background: 'none', border: 0, cursor: 'pointer', padding: 8, borderRadius: 4 }}>
                        <div className="tnum" style={{ fontSize: 17, fontWeight: 600, color: 'var(--accent-deep)' }}>🤲 {t.dua + (duaCount[t.id] || 0)}</div>
                        <div className="f-mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>DUA</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <aside>
                <div style={{ padding: 20, background: 'var(--forest-deep)', color: 'var(--paper)', borderRadius: 4 }}>
                  <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--copper-warm)', letterSpacing: '0.18em', marginBottom: 10 }}>SAMTALSREGLER</div>
                  <ol style={{ paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: 'rgba(245,240,228,0.85)', margin: 0 }}>
                    <li>Respekt — alltid.</li>
                    <li>Frågor över påståenden.</li>
                    <li>Inga DM-länkar. Skriv öppet.</li>
                    <li>Politik utanför projekten — finns andra forum.</li>
                  </ol>
                </div>
                <div style={{ padding: 20, background: '#fff', border: '1px solid var(--line)', borderRadius: 4, marginTop: 16 }}>
                  <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 8 }}>TOTAL DUA</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 300, color: 'var(--accent-deep)' }}>14 327</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>Skickade till alla projekt och samtal det här året.</p>
                </div>
              </aside>
            </div>
          )}

          {tab === 'events' && (
            <div className="mag" style={{ rowGap: 16 }}>
              {DI.events.map(e => (
                <div key={e.id} className="mag-col-6">
                  <div style={{ padding: 24, background: '#fff', border: '1px solid var(--line)', borderRadius: 4, display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 20, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', borderRight: '1px solid var(--line)', paddingRight: 20 }}>
                      <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.06em' }}>{e.date.split(' ')[1].toUpperCase()}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300 }}>{e.date.split(' ')[0]}</div>
                    </div>
                    <div>
                      <Tag tone={e.type === 'Stream' ? 'accent' : 'outline'}>{e.type}</Tag>
                      <h4 className="mag-h3" style={{ fontSize: 18, marginTop: 8, fontWeight: 500 }}>{e.title}</h4>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>{e.city} · {e.going}{e.cap ? `/${e.cap}` : ''} anmälda</div>
                    </div>
                    <Btn variant="primary" size="sm">Anmäl →</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'mosques' && (
            <div style={{ padding: 60, textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 4 }}>
              <p className="mag-lead">Föreningar och moskéer finns i sin egen vy.</p>
              <Btn variant="primary" onClick={() => onNav('catalog')} style={{ marginTop: 16 }}>Öppna föreningskatalogen →</Btn>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// AUDIT — built-in design review, ärende för ärende
// ============================================================
function AuditScreen({ onNav }) {
  const [filter, setFilter] = useStateI('all');
  const [open, setOpen] = useStateI(null);
  const findings = useMemoI(() => DI.audit.filter(f => filter === 'all' || f.sev === filter), [filter]);
  const counts = useMemoI(() => ({
    all: DI.audit.length,
    major: DI.audit.filter(f => f.sev === 'major').length,
    minor: DI.audit.filter(f => f.sev === 'minor').length,
  }), []);
  const bySurface = useMemoI(() => {
    const map = {};
    DI.audit.forEach(f => { (map[f.surface] = map[f.surface] || []).push(f); });
    return map;
  }, []);

  return (
    <div className="studio">
      <section style={{ padding: '40px 0 0' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ AUDIT · INBYGGD GRANSKNING · 24 MAJ 2026</div>
          <h1 className="mag-display" style={{ fontSize: 'clamp(48px, 6.4vw, 96px)', marginTop: 16 }}>
            Otydligheter, hierarkier och saker som <span className="italic">"make no sense"</span>.
          </h1>
          <p className="mag-lead" style={{ marginTop: 24, maxWidth: 640 }}>
            En genomgång av varje yta — vad som var problemet, varför det är ett problem och hur det är åtgärdat i den här versionen.
          </p>

          {/* Summary numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 56, borderTop: '1px solid var(--ink)', paddingTop: 32 }}>
            <div className="mag-stat">
              <span className="figure">{counts.all}</span>
              <span className="label">Fynd totalt</span>
            </div>
            <div className="mag-stat">
              <span className="figure" style={{ color: 'var(--danger)' }}>{counts.major}</span>
              <span className="label">Större</span>
            </div>
            <div className="mag-stat">
              <span className="figure" style={{ color: 'var(--accent-deep)' }}>{counts.minor}</span>
              <span className="label">Mindre</span>
            </div>
            <div className="mag-stat">
              <span className="figure" style={{ color: 'var(--success)' }}>{counts.all}</span>
              <span className="label">Åtgärdade i v0.2</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '56px 0 32px' }}>
        <div className="mag-container">
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              ['all',   `Alla (${counts.all})`],
              ['major', `Större (${counts.major})`],
              ['minor', `Mindre (${counts.minor})`],
            ].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                      style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid ' + (filter === k ? 'var(--ink)' : 'var(--line)'), background: filter === k ? 'var(--ink)' : 'transparent', color: filter === k ? 'var(--paper)' : 'var(--ink-1)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 96px' }}>
        <div className="mag-container">
          {Object.entries(bySurface).map(([surface, items]) => {
            const filtered = items.filter(f => filter === 'all' || f.sev === filter);
            if (filtered.length === 0) return null;
            return (
              <div key={surface} style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--ink)', paddingBottom: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                    <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.16em' }}>YTA</span>
                    <h2 className="mag-h2" style={{ fontSize: 36 }}>{surface}</h2>
                    <span className="f-mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {filtered.length} fynd</span>
                  </div>
                  {surface !== 'Globalt' && (
                    <Btn variant="ghost" size="sm" onClick={() => onNav(surface.toLowerCase())}>Öppna ytan <Icon name="arrow-right" size={12} /></Btn>
                  )}
                </div>
                {filtered.map((f, i) => {
                  const id = surface + '-' + i;
                  const isOpen = open === id;
                  return (
                    <div key={id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <button onClick={() => setOpen(isOpen ? null : id)}
                              style={{ width: '100%', background: 'none', border: 0, padding: '24px 0', display: 'grid', gridTemplateColumns: '32px 100px 1fr auto', gap: 16, cursor: 'pointer', textAlign: 'left', alignItems: 'center' }}>
                        <span className="f-mono" style={{ fontSize: 14, color: 'var(--ink-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                        <Tag tone={f.sev === 'major' ? 'danger' : 'accent'}>{f.sev === 'major' ? 'STÖRRE' : 'MINDRE'}</Tag>
                        <h3 className="mag-h3" style={{ fontSize: 21, fontWeight: 500 }}>{f.title}</h3>
                        <span style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 180ms' }}><Icon name="chevron-right" size={18} /></span>
                      </button>
                      {isOpen && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '0 0 32px 148px', animation: 'fadeUp 240ms ease-out' }}>
                          <div>
                            <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--danger)', letterSpacing: '0.16em', marginBottom: 8 }}>PROBLEM</div>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-1)', margin: 0 }}>{f.issue}</p>
                          </div>
                          <div>
                            <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--success)', letterSpacing: '0.16em', marginBottom: 8 }}>ÅTGÄRDAT</div>
                            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-1)', margin: 0 }}>{f.fix}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// SYSTEM — design system page
// ============================================================
function SystemScreen({ onNav }) {
  return (
    <div className="studio">
      <section style={{ padding: '56px 0' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ DESIGNSYSTEM · v0.2</div>
          <h1 className="mag-display" style={{ fontSize: 'clamp(56px, 6vw, 96px)', marginTop: 16 }}>
            Spectral &amp; <span className="italic">Manrope</span>.<br/>
            Forest, paper, copper.
          </h1>

          <div className="mag" style={{ marginTop: 64, gap: '32px var(--col-gap)' }}>
            {[
              { name: 'Forest',   spec: '#1F4636 · primary', bg: 'var(--forest)', fg: 'var(--paper)' },
              { name: 'Forest deep', spec: '#0F2A1F · sidopanel, dark mode', bg: 'var(--forest-deep)', fg: 'var(--paper)' },
              { name: 'Paper',    spec: '#F5F0E4 · canvas', bg: 'var(--paper)', fg: 'var(--ink)' },
              { name: 'Copper',   spec: '#B8843E · accent', bg: 'var(--copper)', fg: '#fff' },
              { name: 'Ink',      spec: '#0E1411 · rubriker', bg: 'var(--ink)', fg: 'var(--paper)' },
              { name: 'Sage',     spec: '#C6CFC4 · soft surface', bg: 'var(--sage)', fg: 'var(--ink)' },
            ].map(c => (
              <div key={c.name} className="mag-col-4">
                <div style={{ height: 240, background: c.bg, color: c.fg, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: 6 }}>
                  <div className="f-mono" style={{ fontSize: 11, letterSpacing: '0.14em', opacity: 0.7 }}>{c.spec}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300, marginTop: 8 }}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 80, borderTop: '1px solid var(--ink)', paddingTop: 48 }}>
            <h2 className="mag-h1">Typografi</h2>
            <div style={{ marginTop: 32 }}>
              <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em' }}>SPECTRAL · DISPLAY SERIF</div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 96, lineHeight: 1, margin: '12px 0', fontWeight: 300 }}>Ge öppet.</p>
              <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginTop: 32 }}>MANROPE · UI SANS</div>
              <p style={{ fontSize: 17, lineHeight: 1.6, margin: '12px 0', maxWidth: 640 }}>Plattformen är byggd för det muslimska samhället i Sverige. Allt vi gör utgår från tre principer: öppenhet, granskning, transparens.</p>
              <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginTop: 32 }}>JETBRAINS MONO · TABULAR DATA</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, margin: '12px 0' }}>200&nbsp;000 kr · 12 dgr kvar · 74% · ÅÅÅÅMMDD-XXXX</p>
            </div>
          </div>

          <div style={{ marginTop: 80, borderTop: '1px solid var(--ink)', paddingTop: 48 }}>
            <h2 className="mag-h1">Knappar</h2>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              <Btn variant="primary" size="lg">Primary lg</Btn>
              <Btn variant="primary">Primary</Btn>
              <Btn variant="accent">Accent</Btn>
              <Btn variant="secondary">Secondary</Btn>
              <Btn variant="ghost">Ghost</Btn>
            </div>
          </div>

          <div style={{ marginTop: 80, borderTop: '1px solid var(--ink)', paddingTop: 48 }}>
            <h2 className="mag-h1">Tags</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              <Tag>Default</Tag>
              <Tag tone="accent">Accent</Tag>
              <Tag tone="success">✓ Granskad</Tag>
              <Tag tone="danger">⚠ Risk</Tag>
              <Tag tone="outline">Outline</Tag>
              <Tag tone="dark">Dark</Tag>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, {
  AdminScreen, ReviewScreen, TeamScreen, MapScreen, CommunityScreen, AuditScreen, SystemScreen
});
