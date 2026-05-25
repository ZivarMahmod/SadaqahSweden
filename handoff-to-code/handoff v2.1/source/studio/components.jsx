// ============================================================
// SADAQA STUDIO — shell, chrome variants, common components
// ============================================================

const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

// ---------- ICON ----------
function Icon({ name, size = 18, color }) {
  const svg = window.SADAQA?.icon ? window.SADAQA.icon(name, size) : '';
  return <span aria-hidden="true" style={{ display: 'inline-flex', color }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ---------- WORDMARK (paper-on-forest version, sharper) ----------
function Wordmark({ light, size = 20 }) {
  return (
    <div className={`wordmark ${light ? 'wordmark-light' : ''}`} style={{ fontSize: size }}>
      <span className="star" style={{ width: size * 1.05, height: size * 1.05, color: 'var(--copper)' }}
            dangerouslySetInnerHTML={{ __html: window.SADAQA.STAR_SVG }} />
      <span className="wordmark-text">
        <span>Sadaqa</span><span className="sw">Sweden</span>
      </span>
    </div>
  );
}

// ---------- TINY UI BITS ----------
function Tag({ tone = 'default', children }) {
  const cls = {
    default: 'mag-tag',
    accent: 'mag-tag mag-tag-accent',
    danger: 'mag-tag mag-tag-danger',
    success: 'mag-tag mag-tag-success',
    outline: 'mag-tag mag-tag-outline',
    dark: 'mag-tag mag-tag-dark',
  }[tone] || 'mag-tag';
  return <span className={cls}>{children}</span>;
}

function Btn({ variant = 'primary', size, block, children, onClick, ...rest }) {
  const cls = ['mag-btn', `mag-btn-${variant}`, size ? `mag-btn-${size}` : '', block ? 'mag-btn-block' : ''].filter(Boolean).join(' ');
  return <button className={cls} onClick={onClick} {...rest}>{children}</button>;
}

function Eyebrow({ children, num }) {
  return (
    <span className="mag-eyebrow">
      <span className="stroke" />
      {num && <span>{num}</span>}
      <span>{children}</span>
    </span>
  );
}

function ProgressBar({ value, max = 100, thick, dark }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`mag-progress ${thick ? 'thick' : ''} ${dark ? 'dark' : ''}`}>
      <div className="bar" style={{ width: pct + '%' }} />
    </div>
  );
}

// Format currency Swedish (no decimals, kr suffix, thin spaces)
function kr(n) {
  return n.toLocaleString('sv-SE').replace(/\u00A0/g, ' ') + ' kr';
}

// ---------- PHOTO ----------
function Photo({ src, caption, sharp, tags, height, ratio, alt = '' }) {
  const style = ratio ? { aspectRatio: ratio } : (height ? { height } : {});
  return (
    <div className={`mag-photo ${sharp ? 'sharp' : ''}`} style={style}>
      <img src={window.STUDIO_DATA.photos[src] || src} alt={alt} onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.add('mag-photo-empty'); }} />
      {tags && <div className="corner-tags">{tags.map((t, i) => <Tag key={i} tone="dark">{t}</Tag>)}</div>}
      {caption && <span className="caption">{caption}</span>}
    </div>
  );
}

// ============================================================
// CHROME — three variants
// ============================================================

// PUBLIC: visitor / logged-out / discovery
function ChromePublic({ active, onNav, onBurger, screens }) {
  const links = [
    { id: 'discovery',  label: 'Insamlingar' },
    { id: 'catalog',    label: 'Föreningar' },
    { id: 'map',        label: 'Karta' },
    { id: 'community',  label: 'Community' },
    { id: 'marketing#how', label: 'Hur det fungerar' },
  ];
  return (
    <header className="chrome-public">
      <a onClick={() => onNav('marketing')} style={{ cursor: 'pointer' }}>
        <Wordmark />
      </a>
      <nav className="nav-links">
        {links.map(l => (
          <a key={l.id}
             onClick={() => onNav(l.id.split('#')[0])}
             className={'nav-link ' + (active === l.id.split('#')[0] ? 'active' : '')}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <Btn variant="ghost" size="sm" onClick={() => onNav('auth')}>Logga in</Btn>
        <Btn variant="primary" size="sm" onClick={() => onNav('wizard')}>Starta insamling</Btn>
        <button className="chrome-burger" onClick={onBurger} aria-label="Meny">
          <Icon name="menu" size={18} />
        </button>
      </div>
    </header>
  );
}

// INSAMLARE: same look but with "Mina sidor" pill + avatar
function ChromeInsamlare({ active, onNav, onBurger }) {
  const links = [
    { id: 'account',    label: 'Mina insamlingar' },
    { id: 'discovery',  label: 'Utforska' },
    { id: 'community',  label: 'Community' },
    { id: 'profile',    label: 'Min profil' },
  ];
  return (
    <header className="chrome-public" style={{ background: '#fff' }}>
      <a onClick={() => onNav('marketing')} style={{ cursor: 'pointer' }}>
        <Wordmark />
      </a>
      <nav className="nav-links">
        {links.map(l => (
          <a key={l.id} onClick={() => onNav(l.id)}
             className={'nav-link ' + (active === l.id ? 'active' : '')}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <button className="chrome-burger" style={{ width: 38, height: 38 }} title="Notiser">
          <Icon name="bell" size={16} />
        </button>
        <Btn variant="primary" size="sm" onClick={() => onNav('wizard')}>+ Ny insamling</Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 4px 4px', border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer' }} onClick={() => onNav('account')}>
          <div style={{ width: 28, height: 28, background: 'var(--forest)', color: 'var(--paper)', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700 }}>YA</div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Yasmin</span>
        </div>
        <button className="chrome-burger" onClick={onBurger} aria-label="Meny"><Icon name="menu" size={18} /></button>
      </div>
    </header>
  );
}

// ADMIN: minimal topbar with crumbs + system status; sidebar handled separately
function ChromeAdmin({ section, crumb, alerts = 3, onNav }) {
  return (
    <header className="chrome-admin">
      <a onClick={() => onNav('marketing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginRight: 24 }}>
        <span style={{ width: 26, height: 26, color: 'var(--copper)' }} dangerouslySetInnerHTML={{ __html: window.SADAQA.STAR_SVG }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)' }}>Maskinrum</span>
      </a>
      <div className="crumbs">
        <span>{section}</span>
        {crumb && <><span className="sep">/</span><span className="here">{crumb}</span></>}
      </div>
      <div className="systembar">
        <span className="sys-pill"><span className="dot green" /> Stripe live</span>
        <span className="sys-pill"><span className="dot green" /> BankID</span>
        <span className="sys-pill"><span className="dot yellow" /> 3 pending review</span>
        <button className="ico-btn" title="Notiser">
          <Icon name="bell" size={16} />
          {alerts > 0 && <span className="badge">{alerts}</span>}
        </button>
        <button className="ico-btn" title="Inställningar"><Icon name="settings" size={16} /></button>
        <div className="me" onClick={() => onNav('profile')}>
          <span className="av">YA</span>
          <div>
            <div className="name">Yasmin Adan</div>
            <div className="role">ADMIN</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Admin left sidebar (only for admin/team/review)
function AdminSidebar({ active, onNav }) {
  const items = [
    { group: 'ÖVERSIKT', children: [
      { id: 'admin',  label: 'Dashboard', ico: 'dashboard' },
      { id: 'review', label: 'Granskning', ico: 'shield-check', count: 3, alert: true },
      { id: 'audit',  label: 'Audit-rapport', ico: 'file-check', count: 'NY' },
    ]},
    { group: 'DRIFT', children: [
      { id: 'campaigns', label: 'Insamlingar',  ico: 'flag', count: 142 },
      { id: 'donors',    label: 'Donatörer',    ico: 'users', count: '4 213' },
      { id: 'transactions', label: 'Transaktioner', ico: 'wallet' },
      { id: 'collabs',   label: 'Föreningar',   ico: 'building', count: 36 },
    ]},
    { group: 'TEAM', children: [
      { id: 'team',     label: 'Arbetsyta',     ico: 'briefcase' },
      { id: 'inbox',    label: 'Inkommande',    ico: 'inbox', count: 12 },
      { id: 'community', label: 'Community-modd', ico: 'message' },
    ]},
  ];
  return (
    <aside className="admin-sidebar">
      {items.map((g, gi) => (
        <React.Fragment key={gi}>
          <div className="admin-sb-label">{g.group}</div>
          {g.children.map(c => (
            <button key={c.id}
                    className={'admin-sb-item ' + (active === c.id ? 'active' : '')}
                    onClick={() => onNav(c.id)}>
              <span className="ico"><Icon name={c.ico} size={17} /></span>
              <span>{c.label}</span>
              {c.count !== undefined && <span className={'count ' + (c.alert ? 'alert' : '')}>{c.count}</span>}
            </button>
          ))}
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }} />
      <button className="admin-sb-item" onClick={() => onNav('marketing')}>
        <span className="ico"><Icon name="log-out" size={17} /></span>
        <span>Gå till publik vy</span>
      </button>
    </aside>
  );
}

// ============================================================
// HAMBURGER DRAWER
// ============================================================
function BurgerDrawer({ open, onClose, onNav }) {
  if (!open) return null;
  const sections = [
    { label: 'PLATTFORMEN', items: [
      { id: 'marketing', name: 'Startsida', ref: '/' },
      { id: 'discovery', name: 'Hitta insamlingar', ref: '/insamlingar' },
      { id: 'catalog',   name: 'Föreningar', ref: '/foreningar' },
      { id: 'map',       name: 'Karta över Sverige', ref: '/karta' },
      { id: 'community', name: 'Community & events', ref: '/community' },
    ]},
    { label: 'STÖTTA', items: [
      { id: 'fundraiser', name: 'Aktuell insamling', ref: 'M1' },
      { id: 'donate',     name: 'Donera', ref: 'M4' },
      { id: 'wizard',     name: 'Starta egen insamling', ref: 'M2' },
    ]},
    { label: 'MITT KONTO', items: [
      { id: 'account',  name: 'Mina insamlingar', ref: 'M9' },
      { id: 'profile',  name: 'Publik profil', ref: 'M9' },
      { id: 'auth',     name: 'Logga in · BankID', ref: 'M6' },
    ]},
  ];
  return (
    <div className="burger-drawer" onClick={onClose}>
      <div className="burger-drawer-panel" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Stäng"><Icon name="x" size={16} /></button>
        <div className="burger-section">
          <Wordmark light size={22} />
        </div>
        {sections.map(s => (
          <div className="burger-section" key={s.label}>
            <div className="label">{s.label}</div>
            <ul>
              {s.items.map(it => (
                <li key={it.id}>
                  <a onClick={() => { onNav(it.id); onClose(); }}>
                    <span>{it.name}</span>
                    <span className="mono">{it.ref}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STUDIO SIDEBAR — the left rail of the showcase shell
// (groups all surfaces by role + role-of-screen indicator)
// ============================================================
const SCREEN_GROUPS = [
  { label: 'Publik · besökare', role: 'public', items: [
    { id: 'marketing',  num: '01', name: 'Startsida',           live: true },
    { id: 'discovery',  num: '02', name: 'Hitta insamlingar',   live: true },
    { id: 'fundraiser', num: '03', name: 'Insamlingssida',      live: true },
    { id: 'donate',     num: '04', name: 'Donator-flöde',       live: true },
    { id: 'profile',    num: '05', name: 'Publik profil',       live: true },
    { id: 'catalog',    num: '06', name: 'Föreningskatalog',    live: true },
    { id: 'map',        num: '07', name: 'Sverige-karta',       live: true },
    { id: 'community',  num: '08', name: 'Community & events',  live: true },
    { id: 'auth',       num: '09', name: 'BankID-login',        live: true },
  ]},
  { label: 'Insamlare · inloggad', role: 'account', items: [
    { id: 'account',    num: '10', name: 'Mina insamlingar',    live: true },
    { id: 'wizard',     num: '11', name: 'Skapa insamling',     live: true },
    { id: 'update',     num: '12', name: 'Transparens-uppdatering', live: true },
  ]},
  { label: 'Maskinrum · admin', role: 'admin', items: [
    { id: 'admin',      num: '13', name: 'Admin dashboard',     live: true },
    { id: 'review',     num: '14', name: 'Granskningskön',      live: true },
    { id: 'team',       num: '15', name: 'Team-arbetsyta',      live: true },
  ]},
  { label: 'Granskning', role: 'system', items: [
    { id: 'audit',      num: '✸',  name: 'Audit · 17 fynd',     audit: true },
    { id: 'system',     num: '☉',  name: 'Designsystem',        live: true },
  ]},
];

function StudioSidebar({ active, onNav, query, setQuery }) {
  const filtered = SCREEN_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(it => !query || it.name.toLowerCase().includes(query.toLowerCase()) || it.id.includes(query.toLowerCase()))
  })).filter(g => g.items.length > 0);

  return (
    <aside className="studio-sidebar">
      <div className="studio-sb-head">
        <Wordmark light size={22} />
        <div className="label">Studio · v0.2 · 17 ytor</div>
      </div>
      <div className="studio-sb-search">
        <input
          type="text"
          className="studio-sb-search-input"
          placeholder="Sök yta…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <nav className="studio-sb-nav">
        {filtered.map(g => (
          <div className="studio-sb-group" key={g.label}>
            <div className="studio-sb-group-label">
              <span>{g.label}</span>
              <span className="line" />
            </div>
            {g.items.map(it => (
              <button key={it.id}
                      className={'studio-sb-item ' + (active === it.id ? 'active' : '')}
                      onClick={() => onNav(it.id)}>
                <span className="num">{it.num}</span>
                <span className="name">{it.name}</span>
                <span className={'dot ' + (it.audit ? 'audit' : (it.live ? 'live' : 'todo'))} />
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="studio-sb-foot">
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--copper-warm)' }} />
        <span>Utkast · grund v0.2 — 24 maj 2026</span>
      </div>
    </aside>
  );
}

// ============================================================
// STAGE FRAME — adapts to role
// ============================================================
function StageFrame({ screen, role, onNav, children, onBurger, hideMeta }) {
  // role: 'public' | 'account' | 'admin' | 'system'
  let chrome = null;
  let body = children;

  if (role === 'public') {
    chrome = <ChromePublic active={screen} onNav={onNav} onBurger={onBurger} />;
  } else if (role === 'account') {
    chrome = <ChromeInsamlare active={screen} onNav={onNav} onBurger={onBurger} />;
  } else if (role === 'admin') {
    chrome = (
      <>
        <ChromeAdmin section="Maskinrum" crumb={screen === 'admin' ? 'Dashboard' : (screen === 'review' ? 'Granskning' : (screen === 'team' ? 'Arbetsyta' : screen))} onNav={onNav} />
      </>
    );
    body = (
      <div className="admin-layout">
        <AdminSidebar active={screen} onNav={onNav} />
        <div className="admin-content">{children}</div>
      </div>
    );
  }

  return (
    <>
      {!hideMeta && (
        <div className="stage-meta">
          <span className={'pill-mini role-' + role}>{
            role === 'public' ? 'Publik' :
            role === 'account' ? 'Insamlare' :
            role === 'admin' ? 'Admin' : 'System'
          }</span>
          <span className="sep">/</span>
          <span>{screen}.html</span>
          <span className="sep">/</span>
          <span>chrome: {role}</span>
          <div className="stage-meta-actions">
            <button className="stage-action-btn">
              <Icon name="eye" size={12} />
              Live demo
            </button>
            <button className="stage-action-btn" onClick={onBurger}>
              <Icon name="menu" size={12} />
              Meny
            </button>
          </div>
        </div>
      )}
      <div className="stage-frame">
        {chrome}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {body}
        </div>
      </div>
    </>
  );
}

// Public app frame — same as StageFrame but without the studio meta bar (for full-screen)
function PublicFrame({ screen, onNav, children, onBurger }) {
  return (
    <>
      <ChromePublic active={screen} onNav={onNav} onBurger={onBurger} />
      <div style={{ flex: 1 }}>{children}</div>
    </>
  );
}

// Export to window
Object.assign(window, {
  Icon, Wordmark, Tag, Btn, Eyebrow, ProgressBar, kr, Photo,
  ChromePublic, ChromeInsamlare, ChromeAdmin, AdminSidebar,
  BurgerDrawer, StudioSidebar, StageFrame, PublicFrame,
  SCREEN_GROUPS,
});
