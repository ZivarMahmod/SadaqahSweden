// ============================================================
// SADAQA STUDIO — PUBLIC SCREENS
// Marketing · Discovery · Fundraiser · Donate · Profile · Catalog · Auth
// ============================================================

const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;
const D = window.STUDIO_DATA;

// ============================================================
// MARKETING (startsida)
// ============================================================
function MarketingScreen({ onNav }) {
  return (
    <div className="studio">
      {/* Numbered hero — magazine masthead */}
      <section style={{ background: 'var(--paper)', padding: '40px 0 0' }}>
        <div className="mag-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ink)', paddingBottom: 16 }}>
            <Eyebrow num="N° 01">Sadaqa Sweden Quarterly</Eyebrow>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em' }}>SHAWWAL 1447 · MAJ 2026 · UTKAST</span>
          </div>

          <div className="mag" style={{ marginTop: 56, alignItems: 'end' }}>
            <div className="mag-col-7">
              <h1 className="mag-display">
                Ge öppet.<br/>
                Bli granskad.<br/>
                <span className="italic">Visa resultatet.</span>
              </h1>
              <p className="mag-lead" style={{ marginTop: 36, maxWidth: 520 }}>
                En svenskspråkig plattform för det muslimska samhällets insamlingar — där pengarna går direkt till insamlaren via Stripe, varje projekt granskas mot islamiska principer innan publicering, och resultatet bevisas öppet.
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
                <Btn variant="primary" size="lg" onClick={() => onNav('discovery')}>Utforska insamlingar <Icon name="arrow-right" size={16} /></Btn>
                <Btn variant="secondary" size="lg" onClick={() => onNav('wizard')}>Starta din egen</Btn>
              </div>
            </div>
            <div className="mag-col-5">
              <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="f-mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>I FOKUS · GRANSKAD · AKTIV</span>
                <span className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)' }}>74%</span>
              </div>
              <Photo src="well" ratio="4/5" sharp tags={['Aktiv nu', 'Granskad']} caption="DIABALY · MALI · BRUNNSARBETE" />
              <div style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 14, marginTop: 18 }}>
                <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.14em' }}>VATTEN · MALI</div>
                <h3 className="mag-h3" style={{ marginTop: 4 }}>En brunn för byn Diabaly — 280 personer får rent vatten</h3>
                <ProgressBar value={74} thick />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span className="tnum"><strong>{kr(148200)}</strong> av {kr(200000)}</span>
                  <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>12 DGR KVAR</span>
                </div>
              </div>
              <Btn variant="accent" block onClick={() => onNav('fundraiser')} style={{ marginTop: 14 }}>Läs hela storyn <Icon name="arrow-right" size={14} /></Btn>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mag" style={{ marginTop: 80, paddingTop: 28, borderTop: '1px solid var(--line)' }}>
            {[
              ['8,4 mkr',  'samlat in totalt'],
              ['412',      'insamlingar granskade'],
              ['36',       'föreningar anslutna'],
              ['100%',     'till mottagaren'],
            ].map(([f, l], i) => (
              <div key={i} className="mag-col-3">
                <div className="mag-stat">
                  <span className="figure">{f}</span>
                  <span className="label">{l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* § Categories */}
      <Section number="§ 01" title="Kategorier" lead="Var pengarna landar — sex stora och två specialspår för Zakat och Qurban.">
        <div className="mag" style={{ gap: '32px var(--col-gap)' }}>
          {D.categories.map((c, i) => (
            <div key={c.id} className="mag-col-3">
              <a className="mag-card mag-card-flat" onClick={() => onNav('discovery')} style={{ cursor: 'pointer', display: 'block', borderBottom: '1px solid var(--ink)', paddingBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                  <span style={{ flex: 1 }} />
                  <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.count} aktiva</span>
                </div>
                <h3 className="mag-h3" style={{ fontWeight: 400, fontSize: 26 }}>{c.name}</h3>
                <div style={{ marginTop: 14, color: 'var(--accent-deep)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, letterSpacing: '0.06em' }}>
                  Se {c.count} projekt <Icon name="arrow-right" size={12} />
                </div>
              </a>
            </div>
          ))}
        </div>
      </Section>

      {/* § How it works — three-step ed */}
      <Section number="§ 02" title="Så fungerar det" lead="Tre kontrollpunkter — varje insamling går igenom dem före publicering.">
        <div className="mag" style={{ rowGap: 0 }}>
          {[
            { num: '01', name: 'Insamlaren ansöker', body: 'BankID-verifierad. Mottagare, mål, kvitto-plan, story. Femstegswizard.' },
            { num: '02', name: 'Granskare prövar', body: 'Tre principer: ärlig avsikt, klar mottagare, sannolik leverans. Avslag möjligt — utan stigma.' },
            { num: '03', name: 'Bevisplikt under tiden', body: 'Start, utbetalning, resultat. Bilder, kvitton, ord. Tomt = pausad insamling.' },
          ].map(s => (
            <div key={s.num} className="mag-col-4" style={{ borderLeft: '1px solid var(--line)', padding: '8px 32px' }}>
              <div className="f-mono" style={{ fontSize: 12, color: 'var(--accent-deep)', letterSpacing: '0.14em' }}>{s.num}</div>
              <h3 className="mag-h2" style={{ marginTop: 16, fontSize: 32 }}>{s.name}</h3>
              <p style={{ marginTop: 14, color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* § Featured campaigns — magazine grid */}
      <Section number="§ 03" title="Pågående insamlingar" lead="Sex projekt just nu. Klicka in på vilken som helst." right={
        <Btn variant="ghost" size="sm" onClick={() => onNav('discovery')}>Se alla 142 <Icon name="arrow-right" size={14} /></Btn>
      }>
        <div className="mag" style={{ rowGap: 56 }}>
          {D.campaigns.slice(0, 6).map((c, i) => {
            const wide = i === 0;
            return (
              <div key={c.id} className={wide ? 'mag-col-12' : 'mag-col-6'}>
                <CampaignCard campaign={c} onNav={onNav} wide={wide} />
              </div>
            );
          })}
        </div>
      </Section>

      {/* § Trust / Granskningen — dark editorial */}
      <section style={{ background: 'var(--forest-deep)', color: 'var(--paper)', padding: '120px 0' }}>
        <div className="mag-container">
          <div className="mag">
            <div className="mag-col-5">
              <span className="mag-eyebrow" style={{ color: 'var(--copper-warm)' }}>
                <span className="stroke" style={{ background: 'var(--copper-warm)' }} />
                <span>§ 04 — TRYGGHETSLINJEN</span>
              </span>
              <h2 className="mag-h1" style={{ marginTop: 24, color: 'var(--paper)' }}>
                Varför vi granskar <span className="italic" style={{ color: 'var(--copper-warm)' }}>innan</span> — inte efter.
              </h2>
            </div>
            <div className="mag-col-6 mag-col-start-7">
              <p className="mag-lead" style={{ color: 'rgba(245,240,228,0.8)' }}>
                Stora plattformar publicerar först och städar sen. Det fungerar inte för en plats där sadaqa och zakat är på riktigt — fel mottagare är inte ett klick, det är ett brott mot tilliten.
              </p>
              <p style={{ marginTop: 20, color: 'rgba(245,240,228,0.75)', fontSize: 16.5, lineHeight: 1.6 }}>
                Vi gör tvärtom: <strong style={{ color: 'var(--paper)' }}>varje projekt granskas av en utbildad granskare</strong> mot tre principer innan det publiceras. Det är långsammare. Det är meningen.
              </p>
            </div>
          </div>

          <div className="mag" style={{ marginTop: 80, borderTop: '1px solid var(--line-dark-strong)', paddingTop: 56 }}>
            {[
              { num: 'I',   title: 'Ärlig avsikt',     body: 'Är insamlaren den hen säger sig vara? BankID + tidigare projekt + transparenshistorik.' },
              { num: 'II',  title: 'Klar mottagare',   body: 'Vem får pengarna och hur når de fram? En lokal förening, en mosk\u00e9, en familj — alltid identifierad.' },
              { num: 'III', title: 'Sannolik leverans', body: 'Är målet rimligt? Har det gjorts förr? Vad är planen om bara halva summan kommer in?' },
            ].map(p => (
              <div key={p.num} className="mag-col-4" style={{ paddingRight: 32 }}>
                <div className="f-mono" style={{ fontSize: 32, fontWeight: 300, color: 'var(--copper-warm)', letterSpacing: '0.04em' }}>{p.num}</div>
                <h3 className="mag-h2" style={{ marginTop: 18, color: 'var(--paper)', fontSize: 28 }}>{p.title}</h3>
                <p style={{ marginTop: 14, color: 'rgba(245,240,228,0.7)', fontSize: 15.5, lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* § Pull quote */}
      <section style={{ padding: '120px 0', background: 'var(--paper-soft)' }}>
        <div className="mag-container-narrow" style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(28px, 3.6vw, 48px)', lineHeight: 1.25, color: 'var(--ink)', margin: 0, textWrap: 'balance' }}>
            "Den som vägleder till godhet får samma belöning som den som gör det."
          </p>
          <div className="f-mono" style={{ fontSize: 11, letterSpacing: '0.2em', color: 'var(--accent-deep)', marginTop: 24 }}>HADITH · MUSLIM 1893</div>
        </div>
      </section>

      {/* § Föreningar CTA */}
      <Section number="§ 05" title="För föreningar och moskéer" lead="Ni samlar redan in. Vi tar pappersarbetet, tryggheten och plattformen — ni får tid och förtroende tillbaka.">
        <div className="mag-card-bordered" style={{ padding: 56, display: 'grid', gridTemplateColumns: '1.5fr auto', gap: 48, alignItems: 'center' }}>
          <div>
            <h3 className="mag-h2" style={{ maxWidth: 600 }}>Stripe-utbetalning direkt till föreningens konto. Granskning, transparens-loop och kvitton sköts åt er.</h3>
            <p style={{ marginTop: 18, color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>
              Vi tar ingen avgift av föreningar under uppstartsåret. Ert org.nr, era projekt, vår plattform.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Btn variant="primary" size="lg" onClick={() => onNav('catalog')}>Anslut förening <Icon name="arrow-right" size={14} /></Btn>
            <Btn variant="ghost" onClick={() => onNav('catalog')}>Se 36 anslutna →</Btn>
          </div>
        </div>
      </Section>

      <div style={{ height: 80 }} />
    </div>
  );
}

// ---------- Section wrapper ----------
function Section({ number, title, lead, right, children }) {
  return (
    <section style={{ padding: '120px 0', borderTop: '1px solid var(--line)' }}>
      <div className="mag-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, gap: 48, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 640 }}>
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>{number}</div>
            <h2 className="mag-h1" style={{ marginTop: 14 }}>{title}</h2>
            {lead && <p className="mag-lead" style={{ marginTop: 18, maxWidth: 580 }}>{lead}</p>}
          </div>
          {right}
        </div>
        {children}
      </div>
    </section>
  );
}

// ---------- Campaign card (used in marketing + discovery) ----------
function CampaignCard({ campaign, onNav, wide, compact }) {
  const c = campaign;
  if (compact) {
    return (
      <a onClick={() => onNav('fundraiser')} style={{ cursor: 'pointer', display: 'flex', gap: 18, padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ width: 140, flex: '0 0 140px' }}>
          <Photo src={c.photo} sharp ratio="4/3" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.10em' }}>{c.category.toUpperCase()} · {c.location.toUpperCase()}</div>
          <h4 className="mag-h3" style={{ marginTop: 6 }}>{c.title}</h4>
          <ProgressBar value={(c.raised / c.goal) * 100} thick />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13, color: 'var(--ink-2)' }}>
            <span className="tnum"><strong>{kr(c.raised)}</strong> · {Math.round(c.raised / c.goal * 100)}%</span>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.daysLeft} DGR KVAR</span>
          </div>
        </div>
      </a>
    );
  }
  return (
    <a onClick={() => onNav('fundraiser')} className="mag-card-hover" style={{ cursor: 'pointer', display: 'block' }}>
      <div style={{ display: wide ? 'grid' : 'block', gridTemplateColumns: wide ? '1.4fr 1fr' : null, gap: 48 }}>
        <Photo src={c.photo} sharp ratio={wide ? '16/10' : '4/3'} tags={c.tags.slice(0, 2)} caption={c.location.toUpperCase()} />
        <div style={{ paddingTop: wide ? 24 : 22 }}>
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.12em' }}>
            {c.category.toUpperCase()} · {c.location.toUpperCase()}
          </div>
          <h3 className={wide ? 'mag-h1' : 'mag-h3'} style={{ marginTop: 14, fontSize: wide ? 44 : 24, lineHeight: wide ? 1.04 : 1.22, fontWeight: wide ? 400 : 500 }}>
            {c.title}
          </h3>
          {wide && <p className="mag-lead" style={{ marginTop: 18, fontSize: 19, maxWidth: 540 }}>{c.excerpt}</p>}
          <ProgressBar value={(c.raised / c.goal) * 100} thick />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
            <span className="tnum"><strong style={{ color: 'var(--ink)' }}>{kr(c.raised)}</strong> av {kr(c.goal)}</span>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>{Math.round(c.raised/c.goal*100)}% · {c.daysLeft} DGR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--forest)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700 }}>{c.starterInit}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.starter}{c.verified && <span style={{ color: 'var(--forest)', marginLeft: 4 }}>✓</span>}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{c.org}</div>
              </div>
            </div>
            <span style={{ color: 'var(--accent-deep)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Donera <Icon name="arrow-right" size={12} />
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ============================================================
// DISCOVERY — interactive filter
// ============================================================
function DiscoveryScreen({ onNav }) {
  const [cat, setCat] = useStateP(null);
  const [sort, setSort] = useStateP('hot');
  const [q, setQ] = useStateP('');
  const [view, setView] = useStateP('grid');
  const [zakatOnly, setZakatOnly] = useStateP(false);

  const filtered = useMemoP(() => {
    let arr = [...D.campaigns];
    if (cat) arr = arr.filter(c => c.category.toLowerCase().includes(cat.toLowerCase()));
    if (zakatOnly) arr = arr.filter(c => c.zakat);
    if (q) arr = arr.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.location.toLowerCase().includes(q.toLowerCase()));
    if (sort === 'hot') arr.sort((a,b) => b.donors - a.donors);
    if (sort === 'new') arr.sort((a,b) => b.daysLeft - a.daysLeft);
    if (sort === 'goal') arr.sort((a,b) => (b.raised/b.goal) - (a.raised/a.goal));
    if (sort === 'amount') arr.sort((a,b) => b.raised - a.raised);
    return arr;
  }, [cat, sort, q, zakatOnly]);

  return (
    <div className="studio">
      <section style={{ background: 'var(--paper)', padding: '56px 0 24px' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ INSAMLINGAR · {filtered.length} AKTIVA</div>
          <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56 }}>
            Hitta en insamling att stötta.
          </h1>
          <p className="mag-lead" style={{ marginTop: 16, maxWidth: 640 }}>
            Filtrera per kategori, plats eller dagar kvar. Allt här är granskat — välj med hjärta.
          </p>

          {/* Search + sort row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Sök på titel eller plats…"
                     style={{ width: '100%', height: 48, padding: '0 16px 0 44px', border: '1px solid var(--ink)', borderRadius: 4, background: '#fff', fontSize: 14.5, fontFamily: 'var(--font-ui)' }} />
              <span style={{ position: 'absolute', left: 16, top: 14, color: 'var(--ink-3)' }}><Icon name="search" size={18} /></span>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
                    style={{ height: 48, padding: '0 16px', border: '1px solid var(--ink)', borderRadius: 4, background: '#fff', fontFamily: 'var(--font-ui)', fontSize: 14, cursor: 'pointer' }}>
              <option value="hot">Sortera: Populära</option>
              <option value="new">Nyaste</option>
              <option value="goal">Närmast målet</option>
              <option value="amount">Mest insamlat</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 48, border: '1px solid ' + (zakatOnly ? 'var(--accent)' : 'var(--line)'), borderRadius: 4, cursor: 'pointer', background: zakatOnly ? 'rgba(184,132,62,0.08)' : '#fff', fontSize: 13.5, fontWeight: 500 }}>
              <input type="checkbox" checked={zakatOnly} onChange={e => setZakatOnly(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              Endast zakat-OK
            </label>
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={() => setView('grid')} style={{ width: 48, height: 48, background: view === 'grid' ? 'var(--ink)' : '#fff', color: view === 'grid' ? 'var(--paper)' : 'var(--ink-2)', border: 0, cursor: 'pointer' }}><Icon name="grid" size={16} /></button>
              <button onClick={() => setView('list')} style={{ width: 48, height: 48, background: view === 'list' ? 'var(--ink)' : '#fff', color: view === 'list' ? 'var(--paper)' : 'var(--ink-2)', border: 0, cursor: 'pointer', borderLeft: '1px solid var(--line)' }}><Icon name="list" size={16} /></button>
            </div>
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setCat(null)}
                    style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid ' + (cat === null ? 'var(--ink)' : 'var(--line)'), background: cat === null ? 'var(--ink)' : 'transparent', color: cat === null ? 'var(--paper)' : 'var(--ink-1)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
              Alla · {D.campaigns.length}
            </button>
            {D.categories.map(c => (
              <button key={c.id} onClick={() => setCat(cat === c.name ? null : c.name)}
                      style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid ' + (cat === c.name ? 'var(--ink)' : 'var(--line)'), background: cat === c.name ? 'var(--ink)' : 'transparent', color: cat === c.name ? 'var(--paper)' : 'var(--ink-1)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                {c.name} <span style={{ opacity: 0.55, marginLeft: 4 }}>{c.count}</span>
              </button>
            ))}
          </div>

          {(cat || q || zakatOnly) && (
            <div style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>FILTER:</span>
              {cat && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4, fontSize: 12 }}>{cat} <button onClick={() => setCat(null)} style={{ background: 'none', border: 0, color: 'var(--paper)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button></span>}
              {zakatOnly && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--accent)', color: '#fff', borderRadius: 4, fontSize: 12 }}>Zakat-OK <button onClick={() => setZakatOnly(false)} style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button></span>}
              {q && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 4, fontSize: 12 }}>"{q}" <button onClick={() => setQ('')} style={{ background: 'none', border: 0, color: 'var(--paper)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button></span>}
              <button onClick={() => { setCat(null); setQ(''); setZakatOnly(false); }} style={{ background: 'none', border: 0, color: 'var(--accent-deep)', cursor: 'pointer', fontSize: 12.5, textDecoration: 'underline' }}>Rensa allt</button>
            </div>
          )}
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--line)', padding: '48px 0 80px' }}>
        <div className="mag-container">
          {filtered.length === 0 ? (
            <div style={{ padding: '120px 0', textAlign: 'center' }}>
              <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.16em', marginBottom: 16 }}>INGET MATCHADE</div>
              <h3 className="mag-h2">Inget hittades med dina filter.</h3>
              <p className="mag-lead" style={{ marginTop: 14, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>Rensa filtren eller starta en egen insamling i en kategori du saknar.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center' }}>
                <Btn variant="primary" onClick={() => { setCat(null); setQ(''); setZakatOnly(false); }}>Rensa filter</Btn>
                <Btn variant="secondary" onClick={() => onNav('wizard')}>Starta ny insamling</Btn>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="mag" style={{ rowGap: 48 }}>
              {filtered.map(c => (
                <div key={c.id} className="mag-col-4">
                  <CampaignCard campaign={c} onNav={onNav} />
                </div>
              ))}
            </div>
          ) : (
            <div>
              {filtered.map(c => <CampaignCard key={c.id} campaign={c} onNav={onNav} compact />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// FUNDRAISER — single campaign detail page
// ============================================================
function FundraiserScreen({ onNav }) {
  const [tab, setTab] = useStateP('story');
  const [amount, setAmount] = useStateP(200);
  const [donateOpen, setDonateOpen] = useStateP(false);
  const c = D.campaigns[0]; // diabaly

  return (
    <div className="studio">
      <section style={{ padding: '32px 0 0' }}>
        <div className="mag-container">
          {/* Breadcrumb */}
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <a onClick={() => onNav('marketing')} style={{ cursor: 'pointer' }}>HEM</a>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <a onClick={() => onNav('discovery')} style={{ cursor: 'pointer' }}>INSAMLINGAR</a>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span>VATTEN</span>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span style={{ color: 'var(--ink)' }}>DIABALY</span>
          </div>

          {/* Editorial masthead */}
          <div style={{ borderBottom: '1px solid var(--ink)', paddingBottom: 32 }}>
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em', marginBottom: 18 }}>VATTEN · MALI · DIABALY-BYN</div>
            <h1 className="mag-display" style={{ fontSize: 'clamp(40px, 5.4vw, 84px)' }}>
              En brunn för byn Diabaly.<br/>
              <span className="italic">280 personer får rent vatten.</span>
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 32, flexWrap: 'wrap', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 4, background: 'var(--forest)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 22 }}>YA</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 16 }}>Yasmin Adan</strong>
                    <span style={{ color: 'var(--forest)' }}>✓ BankID</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Stockholm · 8 tidigare insamlingar · Trust 92/100</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag tone="success">● Granskad & aktiv</Tag>
                <Tag tone="accent">Zakat-OK</Tag>
                <Tag tone="outline">Collab · Hjälpkraft Sverige</Tag>
              </div>
            </div>
          </div>

          {/* Hero photo */}
          <div style={{ marginTop: 40 }}>
            <Photo src="well" sharp ratio="21/9" caption="DIABALY · MALI · ARBETE PÅGÅR" />
          </div>
        </div>
      </section>

      {/* Main two-col body */}
      <section style={{ padding: '64px 0 120px' }}>
        <div className="mag-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 80 }}>
            {/* Left column — story */}
            <div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ink)', marginBottom: 40 }}>
                {[
                  { id: 'story',  num: '01', label: 'Storyn' },
                  { id: 'proof',  num: '02', label: 'Bevis & uppdateringar', count: 3 },
                  { id: 'recip',  num: '03', label: 'Mottagare' },
                  { id: 'review', num: '04', label: 'Granskning' },
                  { id: 'dua',    num: '05', label: 'Samtal & dua', count: 24 },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                          style={{ background: 'none', border: 0, padding: '14px 18px', cursor: 'pointer', borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'), marginBottom: -1, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-ui)', color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)' }}>
                    <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t.num}</span>
                    <span style={{ fontSize: 13.5, fontWeight: tab === t.id ? 600 : 500 }}>{t.label}</span>
                    {t.count && <span style={{ background: 'var(--accent)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 2, fontWeight: 700 }}>{t.count}</span>}
                  </button>
                ))}
              </div>

              {tab === 'story' && <FrTabStory />}
              {tab === 'proof' && <FrTabProof />}
              {tab === 'recip' && <FrTabRecipient />}
              {tab === 'review' && <FrTabReview />}
              {tab === 'dua' && <FrTabDua />}
            </div>

            {/* Right column — sticky donate card */}
            <aside style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
              <div className="mag-card-bordered" style={{ padding: 32 }}>
                <div className="mag-stat" style={{ marginBottom: 8 }}>
                  <span className="figure">{kr(c.raised)}</span>
                  <span className="label">av {kr(c.goal)} · {Math.round(c.raised/c.goal*100)}%</span>
                </div>
                <ProgressBar value={c.raised/c.goal*100} thick />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span><strong style={{ color: 'var(--ink)' }}>{c.donors}</strong> donatörer</span>
                  <span><strong style={{ color: 'var(--ink)' }}>{c.daysLeft}</strong> dagar kvar</span>
                </div>

                <div style={{ marginTop: 28, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
                  <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 12 }}>VÄLJ BELOPP</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                    {[100, 200, 500, 1000, 2000, 'Eget'].map(a => {
                      const active = a === amount || (a === 'Eget' && ![100,200,500,1000,2000].includes(amount));
                      return (
                        <button key={a} onClick={() => setAmount(a === 'Eget' ? 350 : a)}
                                style={{ height: 48, border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'), background: active ? 'var(--ink)' : '#fff', color: active ? 'var(--paper)' : 'var(--ink-1)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, borderRadius: 4 }}>
                          {a === 'Eget' ? 'Eget' : kr(a)}
                        </button>
                      );
                    })}
                  </div>
                  <Btn variant="accent" size="lg" block onClick={() => onNav('donate')}>
                    Ge {kr(amount)} <Icon name="arrow-right" size={14} />
                  </Btn>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
                    100% till mottagaren. Plattformen tar inga avgifter — Stripes faktiska kortavgifter visas på kvittot.
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Btn variant="ghost" size="sm" onClick={() => alert('Sparad i favoriter')}><Icon name="heart" size={14} /> Spara</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => alert('Länk kopierad')}><Icon name="external" size={14} /> Dela</Btn>
                </div>
              </div>

              {/* Q&A teaser */}
              <div className="mag-card" style={{ marginTop: 16, background: 'var(--paper-soft)', borderRadius: 6 }}>
                <div className="f-mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 10 }}>HAR DU EN FRÅGA?</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-1)', margin: 0 }}>Ställ en fråga till Yasmin. Svar blir publika på sidan.</p>
                <Btn variant="ghost" size="sm" style={{ marginTop: 12, padding: 0 }}>Öppna frågeformulär →</Btn>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function FrTabStory() {
  return (
    <div className="mag-prose">
      <h2 className="mag-h2" style={{ marginBottom: 18 }}>Varför Diabaly</h2>
      <p className="lead">
        Byn Diabaly i centrala Mali har 280 invånare, varav 140 är barn under 12 år. Närmaste rena vattenkälla ligger fyra kilometer bort — barnen som hämtar vatten missar skolan, kvinnorna går två gånger om dagen, och under torrperioden räcker det inte. Förra året var nio barn allvarligt sjuka i diarré som följd.
      </p>
      <div className="mag-pull">"Vi har inte vatten. Vi har en väg till vatten. Skillnaden är vad jag vill ändra på."</div>
      <p>
        En djupbrunn med handpump kostar i Mali <strong>cirka 180 000 kr</strong> inklusive borrning, betongring, pumpinstallation och utbildning av två lokala underhållstekniker. Jag har räknat fram budgeten tillsammans med Wells of Hope Mali, en lokal organisation som har byggt 14 brunnar i regionen sedan 2019.
      </p>
      <p>
        Insamlingen är på <strong>200 000 kr</strong> — extramarginal för transporter och oförutsedda kostnader. Allt som blir över går till en andra pump i grannbyn Massala (240 invånare). Det stora målet är att rent vatten finns på plats innan ramadan 1447.
      </p>

      <h3 className="mag-h3" style={{ marginTop: 48, marginBottom: 16 }}>Budgetuppdelning</h3>
      <div style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
        {[
          ['Borrning + djupundersökning', '92 000 kr', '51%'],
          ['Betongring + pumpinstallation', '46 000 kr', '26%'],
          ['Utbildning av två tekniker', '18 000 kr', '10%'],
          ['Transport + logistik',  '14 000 kr', '8%'],
          ['Marginal + oförutsett', '10 000 kr', '5%'],
        ].map(([n, v, p], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 60px', padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--line)' : 0, fontSize: 14, alignItems: 'center', background: i % 2 ? 'var(--paper-soft)' : '#fff' }}>
            <span>{n}</span>
            <span className="tnum" style={{ marginRight: 32, fontWeight: 600 }}>{v}</span>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrTabProof() {
  const items = [
    { date: '18 maj 2026', type: 'Start', title: 'Insamlingen är granskad och aktiv', body: 'Yasmin verifierad. Wells of Hope Mali bekräftat partner. Stripe-konto verifierat. Ready to go.', proof: '3 dokument' },
    { date: '22 maj 2026', type: 'Uppdatering', title: 'Första 50 000 kr — borrtillstånd inlämnat', body: 'Vi har räckt fram till länsstyrelsen i Ségou-regionen för borrtillstånd. Beräknad tid: 4 veckor.', proof: '2 bilder · 1 dokument' },
    { date: '02 jun 2026', type: 'Bekräftelse', title: 'Borrtillstånd godkänt', body: 'Tillståndet kom in. Borrlag bokat för vecka 26. Pump beställd hos Vergnet i Burkina Faso.', proof: '1 dokument · 4 bilder' },
  ];
  return (
    <div>
      <h2 className="mag-h2" style={{ marginBottom: 24 }}>Bevis & uppdateringar</h2>
      <p className="mag-lead" style={{ marginBottom: 32, color: 'var(--ink-2)' }}>Yasmin postar regelbundet — start, utbetalning, resultat. Tomma månader = pausad insamling.</p>
      <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 32 }}>
        {items.map((it, i) => (
          <div key={i} style={{ marginBottom: 40, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -39, top: 6, width: 12, height: 12, borderRadius: 2, background: 'var(--accent)' }} />
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.14em' }}>{it.date.toUpperCase()} · {it.type.toUpperCase()}</div>
            <h3 className="mag-h3" style={{ marginTop: 6 }}>{it.title}</h3>
            <p style={{ marginTop: 10, fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-1)' }}>{it.body}</p>
            <div style={{ marginTop: 12, display: 'inline-flex', gap: 8, fontSize: 12, color: 'var(--ink-3)' }}>
              <span style={{ padding: '4px 10px', background: 'var(--paper-soft)', borderRadius: 2 }}><Icon name="file-check" size={12} /> {it.proof}</span>
              <span style={{ padding: '4px 10px', background: 'var(--paper-soft)', borderRadius: 2 }}><Icon name="thumbs-up" size={12} /> 24 dua</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrTabRecipient() {
  return (
    <div>
      <h2 className="mag-h2">Mottagare</h2>
      <p className="mag-lead" style={{ marginTop: 18, marginBottom: 32 }}>Pengarna går från Stripe till en registrerad mottagare. Tre led, identifierade.</p>
      <div style={{ display: 'grid', gap: 16 }}>
        {[
          { label: 'INSAMLARE',  name: 'Yasmin Adan',           detail: 'BankID-verifierad · 8 tidigare projekt', },
          { label: 'PARTNER',    name: 'Hjälpkraft Sverige',    detail: 'Org.nr 802534-1234 · Stockholm · 90-konto', },
          { label: 'UTFÖRARE',   name: 'Wells of Hope Mali',    detail: 'Lokal partner · 14 brunnar sedan 2019 · Bamako', },
        ].map((r, i) => (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 24, display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 24, alignItems: 'center' }}>
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.14em' }}>{r.label}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginTop: 4 }}>{r.detail}</div>
            </div>
            <Btn variant="ghost" size="sm">Visa intyg →</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrTabReview() {
  return (
    <div>
      <h2 className="mag-h2">Granskningsbeslut</h2>
      <p className="mag-lead" style={{ marginTop: 18, marginBottom: 32 }}>Granskad av Imran Sayed (granskare-3) den 18 maj 2026. Godkänd utan ändringar.</p>
      {[
        { num: 'I', name: 'Ärlig avsikt', verdict: 'Godkänd', body: 'Insamlaren är BankID-verifierad, har 8 avslutade projekt med transparens-bevis i 7 av dem. Ingen tidigare flagga.', },
        { num: 'II', name: 'Klar mottagare', verdict: 'Godkänd', body: 'Hjälpkraft Sverige verifierad svensk ideell förening, registrerad partner. Wells of Hope Mali underpartner med spårbar historia.', },
        { num: 'III', name: 'Sannolik leverans', verdict: 'Godkänd', body: 'Budget på 180k matchar marknadspris för djupbrunn i Mali. 200k = 11% marginal, rimligt. Wells of Hope har byggt 14 brunnar i samma region.', },
      ].map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 24, padding: '24px 0', borderTop: i === 0 ? '1px solid var(--ink)' : '1px solid var(--line)' }}>
          <div className="f-mono" style={{ fontSize: 28, color: 'var(--accent-deep)', fontWeight: 300 }}>{p.num}</div>
          <div>
            <h4 className="mag-h3" style={{ marginBottom: 8 }}>{p.name}</h4>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-1)', margin: 0 }}>{p.body}</p>
          </div>
          <Tag tone="success">✓ {p.verdict}</Tag>
        </div>
      ))}
    </div>
  );
}

function FrTabDua() {
  const items = [
    { name: 'Amina S.', text: 'May Allah accept this and reward you all. Donated 500 — barakallahu feekum.', at: '4 tim sedan', dua: 18 },
    { name: 'Mohamed K.', text: 'Min familj kommer från en grannby. Det betyder så mycket att se det här hända.', at: '8 tim sedan', dua: 11 },
    { name: 'Ibrahim',   text: 'Ber Allah om att brunnen står i 50 år och blir sadaqa jariya för alla som bidragit.', at: '1 dag sedan', dua: 24 },
  ];
  return (
    <div>
      <h2 className="mag-h2">Samtal & dua</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 32, padding: 20, border: '1px solid var(--line)', borderRadius: 4, background: 'var(--paper-soft)' }}>
        <button style={{ width: 56, height: 56, border: '1px solid var(--accent)', borderRadius: '50%', background: 'rgba(184,132,62,0.10)', color: 'var(--accent-deep)', cursor: 'pointer', fontSize: 22 }}>🤲</button>
        <div>
          <div style={{ fontWeight: 600 }}>Skicka dua</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>Anonymt. Räknas i sidans dua-räknare. <strong>1 247</strong> hittills.</div>
        </div>
      </div>
      {items.map((m, i) => (
        <div key={i} style={{ padding: '20px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>{m.name}</strong>
            <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.at.toUpperCase()}</span>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, margin: 0, color: 'var(--ink-1)' }}>{m.text}</p>
          <button style={{ marginTop: 10, background: 'none', border: 0, color: 'var(--accent-deep)', fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>🤲 {m.dua} dua</button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DONATE — single-step (flattened from 3-step)
// ============================================================
function DonateScreen({ onNav }) {
  const [amount, setAmount] = useStateP(200);
  const [custom, setCustom] = useStateP('');
  const [anon, setAnon] = useStateP(false);
  const [step, setStep] = useStateP(1);
  const c = D.campaigns[0];
  const finalAmount = custom ? Number(custom) : amount;

  return (
    <div className="studio" style={{ minHeight: '100%', background: 'var(--paper-soft)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 40px 96px' }}>
        <button onClick={() => onNav('fundraiser')} style={{ background: 'none', border: 0, color: 'var(--ink-2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 24 }}>
          <Icon name="arrow-left" size={14} /> Tillbaka till insamlingen
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 56 }}>
          {/* Left — campaign summary */}
          <div>
            <Photo src={c.photo} sharp ratio="4/3" caption={c.location.toUpperCase()} />
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.14em', marginTop: 18 }}>{c.category.toUpperCase()} · {c.location.toUpperCase()}</div>
            <h2 className="mag-h2" style={{ marginTop: 10, fontSize: 28 }}>{c.title}</h2>
            <ProgressBar value={c.raised/c.goal*100} thick />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
              <span><strong>{kr(c.raised)}</strong> av {kr(c.goal)}</span>
              <span>{c.donors} donatörer</span>
            </div>

            <div style={{ marginTop: 32, padding: 20, border: '1px solid var(--line)', borderRadius: 4, background: '#fff' }}>
              <div className="f-mono" style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--accent-deep)', marginBottom: 10 }}>SÅ SKER UTBETALNINGEN</div>
              <ol style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-1)', margin: 0 }}>
                <li>Stripe drar ditt belopp.</li>
                <li>Pengarna placeras i mottagarens Stripe Connect-konto.</li>
                <li>Yasmin postar bevis när utbetalning sker — du får mejl.</li>
                <li>Resultat-uppdatering när brunnen står klar.</li>
              </ol>
            </div>
          </div>

          {/* Right — single-step donate form */}
          <div>
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.18em', marginBottom: 12 }}>STEG {step} AV 2 · SADAQA</div>
            <h1 className="mag-h1" style={{ marginBottom: 24, fontSize: 48 }}>
              Ge {kr(finalAmount || 0)}.
            </h1>

            {step === 1 && (
              <div style={{ background: '#fff', border: '1px solid var(--ink)', padding: 32 }}>
                <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 14 }}>VÄLJ BELOPP</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[100, 200, 500, 1000, 2000, 5000].map(a => (
                    <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                            style={{ height: 56, border: '1px solid ' + ((amount === a && !custom) ? 'var(--ink)' : 'var(--line)'), background: (amount === a && !custom) ? 'var(--ink)' : '#fff', color: (amount === a && !custom) ? 'var(--paper)' : 'var(--ink-1)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 15, borderRadius: 4 }}>
                      {kr(a)}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 12, position: 'relative' }}>
                  <input type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Annat belopp i kr"
                         style={{ width: '100%', height: 56, padding: '0 16px', border: '1px solid ' + (custom ? 'var(--ink)' : 'var(--line)'), borderRadius: 4, fontSize: 16, fontFamily: 'var(--font-ui)' }} />
                  {custom && <span style={{ position: 'absolute', right: 16, top: 18, fontSize: 14, color: 'var(--ink-3)' }}>kr</span>}
                </div>

                <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
                  <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.14em', marginBottom: 14 }}>HUR DU VISAS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button onClick={() => setAnon(false)}
                            style={{ padding: '14px 18px', border: '1px solid ' + (!anon ? 'var(--ink)' : 'var(--line)'), background: !anon ? 'var(--ink)' : '#fff', color: !anon ? 'var(--paper)' : 'var(--ink-1)', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Med namn</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Yasmin Adan · BankID</div>
                    </button>
                    <button onClick={() => setAnon(true)}
                            style={{ padding: '14px 18px', border: '1px solid ' + (anon ? 'var(--ink)' : 'var(--line)'), background: anon ? 'var(--ink)' : '#fff', color: anon ? 'var(--paper)' : 'var(--ink-1)', cursor: 'pointer', borderRadius: 4, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Anonym</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Visas inte i listan</div>
                    </button>
                  </div>
                </div>

                <Btn variant="accent" size="lg" block onClick={() => setStep(2)} style={{ marginTop: 28 }}>
                  Gå till Stripe-betalning · {kr(finalAmount || 0)} <Icon name="arrow-right" size={14} />
                </Btn>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', marginTop: 12 }}>
                  🔒 SSL-krypterat · Stripe · Inga uppgifter sparas på sajten
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ background: '#fff', border: '1px solid var(--ink)', padding: 32, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon name="check" size={32} />
                </div>
                <h2 className="mag-h2" style={{ marginBottom: 12 }}>Tack — {kr(finalAmount)} är skickade.</h2>
                <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6, maxWidth: 420, margin: '0 auto 28px' }}>
                  Kvitto skickat till <strong>yasmin@example.com</strong>. Du får ett mejl när Yasmin postar nästa transparens-uppdatering.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Btn variant="primary" onClick={() => onNav('fundraiser')}>Tillbaka till sidan</Btn>
                  <Btn variant="ghost" onClick={() => onNav('discovery')}>Utforska fler →</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE — public profile (insamlare)
// ============================================================
function ProfileScreen({ onNav }) {
  const [showTrust, setShowTrust] = useStateP(false);
  return (
    <div className="studio">
      <section style={{ padding: '56px 0 32px', borderBottom: '1px solid var(--ink)' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.12em', marginBottom: 24 }}>PROFIL · INSAMLARE · STOCKHOLM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 40, alignItems: 'end' }}>
            <div style={{ width: 180, height: 180, borderRadius: 4, background: 'var(--forest)', color: 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 300 }}>YA</div>
            <div>
              <h1 className="mag-display" style={{ fontSize: 'clamp(40px, 5vw, 76px)' }}>Yasmin Adan</h1>
              <p className="mag-lead" style={{ marginTop: 14 }}>Stockholm · 8 avslutade insamlingar · medlem sedan 2024.</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Tag tone="success">✓ BankID-verifierad</Tag>
                <Tag tone="accent">Verifierad insamlare</Tag>
                <Tag tone="outline">Collab · Hjälpkraft Sverige</Tag>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowTrust(!showTrust)}
                      style={{ border: '1px solid var(--ink)', padding: 24, background: '#fff', cursor: 'pointer', borderRadius: 4, textAlign: 'right' }}>
                <div className="f-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--ink-3)' }}>TRUST-POÄNG</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, lineHeight: 1, fontWeight: 300, color: 'var(--ink)', marginTop: 4 }}>92<span style={{ color: 'var(--ink-3)', fontSize: 32 }}>/100</span></div>
                <div style={{ fontSize: 11.5, color: 'var(--accent-deep)', marginTop: 6 }}>Klicka för uträkning →</div>
              </button>
              {showTrust && (
                <div style={{ position: 'absolute', right: 0, top: '110%', width: 320, background: 'var(--forest-deep)', color: 'var(--paper)', padding: 20, zIndex: 10, borderRadius: 4 }}>
                  <div className="f-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: 'var(--copper-warm)', marginBottom: 10 }}>SÅ RÄKNAS 92</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13 }}>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(245,240,228,0.10)' }}><span>BankID-verifierad</span> <span style={{ color: 'var(--copper-warm)' }}>+30</span></li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(245,240,228,0.10)' }}><span>8 avslutade insamlingar</span> <span style={{ color: 'var(--copper-warm)' }}>+24</span></li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(245,240,228,0.10)' }}><span>Transparens-bevis 7/8</span> <span style={{ color: 'var(--copper-warm)' }}>+28</span></li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(245,240,228,0.10)' }}><span>Föreningskoppling</span> <span style={{ color: 'var(--copper-warm)' }}>+10</span></li>
                    <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>1 missad uppdatering</span> <span style={{ color: 'var(--danger)' }}>-0</span></li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 56, borderTop: '1px solid var(--line)', paddingTop: 32 }}>
            {[
              ['8',         'Avslutade'],
              ['1',         'Aktiv just nu'],
              [kr(2480000), 'Total insamling'],
              ['1 247',     'Donatörer totalt'],
            ].map(([f, l], i) => (
              <div key={i} className="mag-stat">
                <span className="figure">{f}</span>
                <span className="label">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section number="§ AKTIVT" title="Pågående insamling">
        <CampaignCard campaign={D.campaigns[0]} onNav={onNav} wide />
      </Section>

      <Section number="§ HISTORIA" title="Tidigare insamlingar — alla bevisade">
        <div style={{ borderTop: '1px solid var(--ink)' }}>
          {[
            { year: 2025, title: 'Iftar för 400 — Stockholm', raised: 64000, proof: 'Komplett bevis', orgs: 'Tensta IC' },
            { year: 2025, title: 'Vinterhjälp Aleppo',         raised: 184000, proof: 'Komplett bevis', orgs: 'Syriahjälpen' },
            { year: 2024, title: 'Vattentankar — Somalia',    raised: 220000, proof: 'Komplett bevis', orgs: 'Hjälpkraft' },
            { year: 2024, title: 'Skolböcker — Bangladesh',   raised: 38000,  proof: 'Komplett bevis', orgs: 'Education for All' },
            { year: 2024, title: 'Medicinsk hjälp — Pakistan', raised: 142000, proof: 'Komplett bevis', orgs: 'Hjälpkraft' },
            { year: 2024, title: 'Föräldralösa Jemen',         raised: 89000,  proof: 'Bevis saknas (1 av 3)', orgs: 'Yemen Aid', flag: true },
            { year: 2023, title: 'Iftar Rinkeby',             raised: 22000,  proof: 'Komplett bevis', orgs: 'Rinkeby IC' },
            { year: 2023, title: 'Brunn Etiopien',            raised: 175000, proof: 'Komplett bevis', orgs: 'Wells of Hope' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto auto', gap: 24, padding: '20px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
              <span className="f-mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{p.year}</span>
              <span style={{ fontSize: 16, fontWeight: 500 }}>{p.title}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{p.orgs}</span>
              <span className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>{kr(p.raised)}</span>
              <Tag tone={p.flag ? 'danger' : 'success'}>{p.flag ? '⚠' : '✓'} {p.proof}</Tag>
            </div>
          ))}
        </div>
      </Section>

      <Section number="§ KONTAKT" title="Ställ en fråga till Yasmin">
        <div style={{ background: 'var(--paper-soft)', border: '1px solid var(--line)', padding: 32, borderRadius: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-1)', margin: 0 }}>
              Svar blir publika på profilen. Strukturerade frågor — inget chatt-DM. Yasmin svarar inom 48h i snitt.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {['Om projektet i Diabaly', 'Om en tidigare insamling', 'Om collab eller volontär', 'Annat'].map(t => (
                <button key={t} style={{ padding: '12px 14px', border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', textAlign: 'left', borderRadius: 4, fontSize: 14 }}>{t} →</button>
              ))}
            </div>
          </div>
          <div>
            <textarea placeholder="Din fråga…" rows={6} style={{ width: '100%', padding: 14, border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'var(--font-ui)', fontSize: 14, resize: 'vertical', background: '#fff' }} />
            <Btn variant="primary" block style={{ marginTop: 12 }}>Skicka fråga</Btn>
          </div>
        </div>
      </Section>

      <div style={{ height: 80 }} />
    </div>
  );
}

// ============================================================
// CATALOG — organizations
// ============================================================
function CatalogScreen({ onNav }) {
  const [city, setCity] = useStateP(null);
  const orgs = [
    { name: 'Hjälpkraft Sverige', city: 'Stockholm', active: 12, total: kr(2400000), verified: true, type: 'Hjälporganisation', ico: 'building' },
    { name: 'Malmö islamiska center', city: 'Malmö', active: 4, total: kr(840000), verified: true, type: 'Moské', ico: 'building' },
    { name: 'Tensta islamiska center', city: 'Stockholm', active: 6, total: kr(620000), verified: true, type: 'Moské' },
    { name: 'Education for All', city: 'Göteborg', active: 3, total: kr(1100000), verified: true, type: 'Hjälporganisation' },
    { name: 'Syriahjälpen', city: 'Uppsala', active: 8, total: kr(3200000), verified: true, type: 'Hjälporganisation' },
    { name: 'Bosniska föreningen', city: 'Helsingborg', active: 2, total: kr(180000), verified: true, type: 'Förening' },
    { name: 'Somali Welfare', city: 'Stockholm', active: 5, total: kr(720000), verified: true, type: 'Förening' },
    { name: 'Rinkeby IC', city: 'Stockholm', active: 3, total: kr(290000), verified: true, type: 'Moské' },
    { name: 'Yemen Aid', city: 'Malmö', active: 4, total: kr(910000), verified: true, type: 'Hjälporganisation' },
  ];
  const cities = [...new Set(orgs.map(o => o.city))];
  const filtered = city ? orgs.filter(o => o.city === city) : orgs;

  return (
    <div className="studio">
      <section style={{ padding: '56px 0 32px' }}>
        <div className="mag-container">
          <div className="f-mono" style={{ fontSize: 11, color: 'var(--accent-deep)', letterSpacing: '0.16em' }}>§ FÖRENINGAR · 36 ANSLUTNA</div>
          <h1 className="mag-h1" style={{ marginTop: 14, fontSize: 56, maxWidth: 800 }}>Föreningar och moskéer som driver insamlingar på Sadaqa Sweden.</h1>
          <div style={{ display: 'flex', gap: 6, marginTop: 28, flexWrap: 'wrap' }}>
            <button onClick={() => setCity(null)} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid ' + (city === null ? 'var(--ink)' : 'var(--line)'), background: city === null ? 'var(--ink)' : 'transparent', color: city === null ? 'var(--paper)' : 'var(--ink-1)', fontSize: 13, cursor: 'pointer' }}>Alla städer</button>
            {cities.map(ct => (
              <button key={ct} onClick={() => setCity(city === ct ? null : ct)} style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid ' + (city === ct ? 'var(--ink)' : 'var(--line)'), background: city === ct ? 'var(--ink)' : 'transparent', color: city === ct ? 'var(--paper)' : 'var(--ink-1)', fontSize: 13, cursor: 'pointer' }}>{ct}</button>
            ))}
          </div>
        </div>
      </section>
      <section style={{ borderTop: '1px solid var(--line)', padding: '48px 0 96px' }}>
        <div className="mag-container">
          <div className="mag" style={{ rowGap: 0 }}>
            {filtered.map((o, i) => (
              <div key={o.name} className="mag-col-12" style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1fr 1fr 140px auto', gap: 24, padding: '24px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
                <span className="f-mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 18 }}>{o.name}</strong>
                    {o.verified && <span style={{ color: 'var(--forest)', fontSize: 13 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{o.type} · {o.city}</div>
                </div>
                <div style={{ fontSize: 14 }}><strong>{o.active}</strong> aktiva insamlingar</div>
                <div className="tnum" style={{ fontSize: 14 }}><strong>{o.total}</strong> total</div>
                <Tag tone="success">Verifierad partner</Tag>
                <Btn variant="ghost" size="sm">Se profil →</Btn>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================
// AUTH — BankID login
// ============================================================
function AuthScreen({ onNav }) {
  const [mode, setMode] = useStateP('bankid');
  const [code, setCode] = useStateP('');
  const [waiting, setWaiting] = useStateP(false);
  return (
    <div className="studio" style={{ minHeight: '100%', background: 'var(--paper)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 68px)' }}>
        <div style={{ padding: '64px 56px', background: 'var(--forest-deep)', color: 'var(--paper)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="f-mono" style={{ fontSize: 11, color: 'var(--copper-warm)', letterSpacing: '0.18em' }}>§ LOGGA IN</div>
            <h1 className="mag-h1" style={{ marginTop: 18, color: 'var(--paper)' }}>Logga in på Sadaqa Sweden.</h1>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: 'rgba(245,240,228,0.7)', marginTop: 18, maxWidth: 380 }}>
              Vi använder BankID för att verifiera dig som insamlare. Du behöver inte logga in för att donera — bara för att skapa insamlingar.
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,240,228,0.45)' }}>
            Behöver du hjälp? Skriv till <a href="mailto:support@sadaqasweden.se" style={{ color: 'var(--copper-warm)' }}>support@sadaqasweden.se</a>
          </div>
        </div>
        <div style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
            <button onClick={() => setMode('bankid')} style={{ padding: '8px 16px', border: 0, borderBottom: '2px solid ' + (mode === 'bankid' ? 'var(--accent)' : 'var(--line)'), background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, color: mode === 'bankid' ? 'var(--ink)' : 'var(--ink-3)' }}>BankID</button>
            <button onClick={() => setMode('email')} style={{ padding: '8px 16px', border: 0, borderBottom: '2px solid ' + (mode === 'email' ? 'var(--accent)' : 'var(--line)'), background: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600, color: mode === 'email' ? 'var(--ink)' : 'var(--ink-3)' }}>E-post</button>
          </div>
          {mode === 'bankid' && !waiting && (
            <div>
              <label style={{ fontSize: 13, color: 'var(--ink-2)' }}>Personnummer</label>
              <input value={code} onChange={e => setCode(e.target.value)} placeholder="ÅÅÅÅMMDD-XXXX" maxLength={13}
                     style={{ width: '100%', height: 56, marginTop: 8, padding: '0 16px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 16, fontFamily: 'var(--font-mono)' }} />
              <Btn variant="primary" size="lg" block onClick={() => setWaiting(true)} style={{ marginTop: 20 }}>Öppna BankID</Btn>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 14 }}>Eller på <a style={{ color: 'var(--accent-deep)', textDecoration: 'underline', cursor: 'pointer' }}>annan enhet</a>.</p>
            </div>
          )}
          {mode === 'bankid' && waiting && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
              <h3 className="mag-h3">Öppna BankID-appen…</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 8 }}>Väntar på signering. <button onClick={() => { setWaiting(false); onNav('account'); }} style={{ background: 'none', border: 0, color: 'var(--accent-deep)', textDecoration: 'underline', cursor: 'pointer' }}>Hoppa till konto (demo)</button></p>
            </div>
          )}
          {mode === 'email' && (
            <div>
              <label style={{ fontSize: 13, color: 'var(--ink-2)' }}>E-postadress</label>
              <input type="email" placeholder="du@exempel.se" style={{ width: '100%', height: 56, marginTop: 8, padding: '0 16px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 16 }} />
              <label style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 16, display: 'block' }}>Lösenord</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', height: 56, marginTop: 8, padding: '0 16px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 16 }} />
              <Btn variant="primary" size="lg" block onClick={() => onNav('account')} style={{ marginTop: 20 }}>Logga in</Btn>
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 12, textAlign: 'center' }}><a style={{ color: 'var(--accent-deep)', textDecoration: 'underline', cursor: 'pointer' }}>Glömt lösenordet?</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export
Object.assign(window, {
  MarketingScreen, DiscoveryScreen, FundraiserScreen, DonateScreen,
  ProfileScreen, CatalogScreen, AuthScreen, CampaignCard, Section,
});
