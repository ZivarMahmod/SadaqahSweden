// ============================================================
// SADAQA STUDIO — main app shell
// Routes between screens, holds tweaks, wires chrome
// ============================================================

const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

// Screen registry
const SCREENS = {
  marketing:  { role: 'public',  Component: () => window.MarketingScreen,  num: '01', name: 'Startsida' },
  discovery:  { role: 'public',  Component: () => window.DiscoveryScreen,  num: '02', name: 'Hitta insamlingar' },
  fundraiser: { role: 'public',  Component: () => window.FundraiserScreen, num: '03', name: 'Insamlingssida' },
  donate:     { role: 'public',  Component: () => window.DonateScreen,     num: '04', name: 'Donator-flöde' },
  profile:    { role: 'public',  Component: () => window.ProfileScreen,    num: '05', name: 'Publik profil' },
  catalog:    { role: 'public',  Component: () => window.CatalogScreen,    num: '06', name: 'Föreningskatalog' },
  map:        { role: 'public',  Component: () => window.MapScreen,        num: '07', name: 'Sverige-karta' },
  community:  { role: 'public',  Component: () => window.CommunityScreen,  num: '08', name: 'Community & events' },
  auth:       { role: 'public',  Component: () => window.AuthScreen,       num: '09', name: 'BankID-login', noChrome: true },
  account:    { role: 'account', Component: () => window.AccountScreen,    num: '10', name: 'Mina insamlingar' },
  wizard:     { role: 'account', Component: () => window.WizardScreen,     num: '11', name: 'Skapa insamling' },
  update:     { role: 'account', Component: () => window.UpdateScreen,     num: '12', name: 'Transparens-uppdatering' },
  admin:      { role: 'admin',   Component: () => window.AdminScreen,      num: '13', name: 'Admin dashboard' },
  review:     { role: 'admin',   Component: () => window.ReviewScreen,     num: '14', name: 'Granskningskön' },
  team:       { role: 'admin',   Component: () => window.TeamScreen,       num: '15', name: 'Team-arbetsyta' },
  audit:      { role: 'system',  Component: () => window.AuditScreen,      num: '✸',  name: 'Audit · 17 fynd' },
  system:     { role: 'system',  Component: () => window.SystemScreen,     num: '☉',  name: 'Designsystem' },
};

// Initial screen — read from hash if present
function readHash() {
  const h = window.location.hash.replace('#', '');
  return SCREENS[h] ? h : 'marketing';
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent":     "copper",
  "displayFont": "Spectral",
  "uiFont":     "Manrope",
  "showStudioChrome": true,
  "denseSidebar": false
}/*EDITMODE-END*/;

const ACCENT_PALETTE = {
  copper:  { c: '#B8843E', d: '#8E6429', warm: '#D4A567' },
  forest:  { c: '#2D6B4F', d: '#1F4636', warm: '#4D8A6B' },
  ink:     { c: '#0E1411', d: '#000000', warm: '#3A453E' },
  rust:    { c: '#A04A2D', d: '#7A3520', warm: '#C97A5B' },
  ocean:   { c: '#2E5C8A', d: '#1E3F66', warm: '#5C8AB8' },
};

const DISPLAY_FONTS = {
  Spectral:    "'Spectral', Georgia, serif",
  Playfair:    "'Playfair Display', Georgia, serif",
  Fraunces:    "'Fraunces', Georgia, serif",
  EBGaramond:  "'EB Garamond', Georgia, serif",
};
const UI_FONTS = {
  Manrope:     "'Manrope', system-ui, sans-serif",
  Inter:       "'Inter', system-ui, sans-serif",
  WorkSans:    "'Work Sans', system-ui, sans-serif",
};

function App() {
  const lockScreen = window.__V2_LOCK_SCREEN;
  const [screen, setScreen] = useStateApp(lockScreen || readHash());
  const [tweaks, setTweaks] = useStateApp(lockScreen ? { ...TWEAK_DEFAULTS, showStudioChrome: false } : TWEAK_DEFAULTS);
  const [burger, setBurger] = useStateApp(false);
  const [sbQuery, setSbQuery] = useStateApp('');
  const [tweaksOpen, setTweaksOpen] = useStateApp(false);

  // Sync hash → screen (skip if locked)
  useEffectApp(() => {
    if (lockScreen) return;
    const onHash = () => setScreen(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Apply accent + fonts to :root
  useEffectApp(() => {
    const p = ACCENT_PALETTE[tweaks.accent] || ACCENT_PALETTE.copper;
    document.documentElement.style.setProperty('--accent', p.c);
    document.documentElement.style.setProperty('--accent-deep', p.d);
    document.documentElement.style.setProperty('--copper', p.c);
    document.documentElement.style.setProperty('--copper-deep', p.d);
    document.documentElement.style.setProperty('--copper-warm', p.warm);
    document.documentElement.style.setProperty('--font-display', DISPLAY_FONTS[tweaks.displayFont] || DISPLAY_FONTS.Spectral);
    document.documentElement.style.setProperty('--font-ui', UI_FONTS[tweaks.uiFont] || UI_FONTS.Manrope);
  }, [tweaks]);

  const nav = (id) => {
    if (!SCREENS[id]) return;
    if (lockScreen) {
      // In locked single-page mode, navigate by changing window.location to that slide
      window.location.href = id + '.html';
      return;
    }
    setScreen(id);
    window.location.hash = id;
    setTimeout(() => {
      const stage = document.querySelector('.stage-frame > div:last-child');
      if (stage) stage.scrollTop = 0;
    }, 0);
  };

  const setTweak = (key, value) => {
    const next = typeof key === 'object' ? { ...tweaks, ...key } : { ...tweaks, [key]: value };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: next }, '*');
  };

  // Edit-mode protocol
  useEffectApp(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweaksOpen(true);
      if (e.data?.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const meta = SCREENS[screen];
  const Comp = meta.Component();

  const showShell = tweaks.showStudioChrome;

  return (
    <div className="studio" data-screen-label={meta.num + ' ' + meta.name}>
      {showShell ? (
        <div className="studio-shell">
          <StudioSidebar active={screen} onNav={nav} query={sbQuery} setQuery={setSbQuery} />
          <div className="studio-stage" data-screen-label={meta.num + ' ' + meta.name}>
            <StageFrame
              screen={screen}
              role={meta.role}
              onNav={nav}
              onBurger={() => setBurger(true)}
              hideMeta={false}
            >
              {Comp ? <Comp onNav={nav} /> : <div style={{ padding: 80, textAlign: 'center' }}>Laddar…</div>}
            </StageFrame>
          </div>
        </div>
      ) : (
        <div className="studio-stage" data-screen-label={meta.num + ' ' + meta.name}>
          <StageFrame
            screen={screen}
            role={meta.role}
            onNav={nav}
            onBurger={() => setBurger(true)}
            hideMeta={true}
          >
            {Comp ? <Comp onNav={nav} /> : null}
          </StageFrame>
        </div>
      )}

      <BurgerDrawer open={burger} onClose={() => setBurger(false)} onNav={nav} />

      {tweaksOpen && (
        <TweaksPanel
          title="Tweaks"
          onClose={() => { setTweaksOpen(false); window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); }}
        >
          <TweakSection title="Visning">
            <TweakToggle label="Studio-chrome (sidebar)" value={tweaks.showStudioChrome} onChange={v => setTweak('showStudioChrome', v)} />
          </TweakSection>
          <TweakSection title="Accentfärg">
            <TweakColor
              label="Accent"
              value={tweaks.accent}
              options={[
                ['#B8843E','#8E6429'],
                ['#2D6B4F','#1F4636'],
                ['#0E1411','#3A453E'],
                ['#A04A2D','#7A3520'],
                ['#2E5C8A','#1E3F66'],
              ]}
              optionLabels={['Copper','Forest','Ink','Rust','Ocean']}
              onChange={(palette, idx) => {
                const keys = ['copper','forest','ink','rust','ocean'];
                setTweak('accent', keys[idx]);
              }}
            />
          </TweakSection>
          <TweakSection title="Typsnitt">
            <TweakSelect label="Display (rubriker)" value={tweaks.displayFont} options={Object.keys(DISPLAY_FONTS)} onChange={v => setTweak('displayFont', v)} />
            <TweakSelect label="UI (brödtext)" value={tweaks.uiFont} options={Object.keys(UI_FONTS)} onChange={v => setTweak('uiFont', v)} />
          </TweakSection>
          <TweakSection title="Navigera till">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {Object.keys(SCREENS).map(id => (
                <button key={id} onClick={() => nav(id)}
                        style={{ padding: '6px 8px', fontSize: 11, border: '1px solid ' + (screen === id ? '#fff' : 'rgba(255,255,255,0.2)'), background: screen === id ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#fff', cursor: 'pointer', borderRadius: 3, textAlign: 'left' }}>
                  <span style={{ opacity: 0.6, fontFamily: 'monospace' }}>{SCREENS[id].num}</span> {SCREENS[id].name.length > 16 ? SCREENS[id].name.slice(0, 16) + '…' : SCREENS[id].name}
                </button>
              ))}
            </div>
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
