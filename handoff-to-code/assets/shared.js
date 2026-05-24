// ============================================================
// SADAQA SWEDEN — shared chrome helpers
// Wordmark SVG, lucide icon inject, footer template
// ============================================================

(function () {
  // 8-pointed star (rub el hizb) — the brand mark
  const STAR_SVG = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16 1.5L19.6 12.4L30.5 16L19.6 19.6L16 30.5L12.4 19.6L1.5 16L12.4 12.4L16 1.5Z" fill="currentColor" stroke="currentColor" stroke-width="0.8" stroke-linejoin="round"/>
    <path d="M16 6.5L18.1 13L24.5 16L18.1 19L16 25.5L13.9 19L7.5 16L13.9 13L16 6.5Z" fill="rgba(0,0,0,0.18)"/>
    <circle cx="16" cy="16" r="2" fill="rgba(245,240,228,0.92)"/>
  </svg>`;

  const STAR_MINI = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 0.5L9.8 6.2L15.5 8L9.8 9.8L8 15.5L6.2 9.8L0.5 8L6.2 6.2L8 0.5Z" fill="currentColor"/>
  </svg>`;

  window.SADAQA = {
    STAR_SVG,
    STAR_MINI,
    wordmark(opts = {}) {
      const light = opts.light ? 'wordmark-light' : '';
      const size = opts.size || 22;
      const tag = opts.href ? 'a' : 'span';
      const href = opts.href ? ` href="${opts.href}"` : '';
      return `<${tag}${href} class="wordmark ${light}" style="font-size:${size}px">
        <span class="star" style="width:${Math.round(size*1.05)}px;height:${Math.round(size*1.05)}px;color:var(--copper)">${STAR_SVG}</span>
        <span class="wordmark-text">
          <span>Sadaqa</span><span class="sw">Sweden</span>
        </span>
      </${tag}>`;
    },
    poweredBy() {
      return `<span class="powered-by">
        <span class="pb-mark"></span>
        Powered by Corevo
      </span>`;
    },
    footer() {
      return `<footer class="footer">
        <div class="footer-grid">
          <div class="footer-col">
            ${this.wordmark({ light: true, size: 22 })}
            <p class="small" style="color:rgba(245,240,228,0.55); margin: 20px 0 0; max-width: 320px;">
              Svenskspråkig insamlingsplattform för det muslimska samhället i Sverige. Granskad. Trygg. Öppen.
            </p>
          </div>
          <div class="footer-col">
            <h5>Plattformen</h5>
            <ul>
              <li><a href="discovery.html">Insamlingar</a></li>
              <li><a href="catalog.html">Föreningar</a></li>
              <li><a href="map.html">Karta</a></li>
              <li><a href="community.html">Community</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>Stötta</h5>
            <ul>
              <li><a href="#">Hur det fungerar</a></li>
              <li><a href="#">Granskningen</a></li>
              <li><a href="#">Transparens</a></li>
              <li><a href="#">Sadaqa &amp; Zakat</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>Förening</h5>
            <ul>
              <li><a href="#">Anmäl er förening</a></li>
              <li><a href="#">För moskéer</a></li>
              <li><a href="#">Samarbeten</a></li>
              <li><a href="#">Föreningsstöd</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>Kontakt</h5>
            <ul>
              <li><a href="mailto:hej@sadaqasweden.se">hej@sadaqasweden.se</a></li>
              <li><a href="mailto:support@sadaqasweden.se">support@sadaqasweden.se</a></li>
              <li><a href="#">Integritet</a></li>
              <li><a href="#">Villkor</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Sadaqa Sweden ideell förening · Org.nr 802534-XXXX</span>
          ${this.poweredBy()}
        </div>
      </footer>`;
    },
    icon(name, size = 18) {
      // returns inline SVG for common icons we use — small set
      const stroke = `stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
      const wrap = (d) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${stroke} aria-hidden="true">${d}</svg>`;
      const icons = {
        'arrow-right': `<path d="M5 12h14M13 5l7 7-7 7"/>`,
        'arrow-left': `<path d="M19 12H5M11 19l-7-7 7-7"/>`,
        'check': `<path d="M5 12l5 5L20 7"/>`,
        'check-circle': `<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/>`,
        'shield': `<path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/>`,
        'shield-check': `<path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z"/><path d="M8 12l3 3 5-5"/>`,
        'star': `<path d="M12 2l3 7 7 .8-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.5L2 9.8 9 9z"/>`,
        'star-filled': `<path d="M12 2l3 7 7 .8-5.3 4.7L18 22l-6-3.6L6 22l1.3-7.5L2 9.8 9 9z" fill="currentColor" stroke="none"/>`,
        'heart': `<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>`,
        'user': `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>`,
        'users': `<circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="7" r="2.5"/><path d="M22 19c0-2.5-2-4-4.5-4"/>`,
        'building': `<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/>`,
        'map-pin': `<path d="M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/>`,
        'map': `<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>`,
        'calendar': `<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
        'search': `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>`,
        'filter': `<path d="M3 5h18M6 12h12M10 19h4"/>`,
        'plus': `<path d="M12 5v14M5 12h14"/>`,
        'x': `<path d="M6 6l12 12M18 6L6 18"/>`,
        'menu': `<path d="M4 7h16M4 12h16M4 17h16"/>`,
        'chevron-right': `<path d="M9 6l6 6-6 6"/>`,
        'chevron-down': `<path d="M6 9l6 6 6-6"/>`,
        'home': `<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>`,
        'dashboard': `<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>`,
        'inbox': `<path d="M3 13l3-8h12l3 8M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6M3 13h5l2 3h4l2-3h5"/>`,
        'briefcase': `<rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>`,
        'list': `<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>`,
        'grid': `<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>`,
        'edit': `<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>`,
        'eye': `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
        'eye-off': `<path d="M17.9 17.9A11 11 0 0 1 12 20C5 20 1 12 1 12a21.3 21.3 0 0 1 5.1-5.9M9.9 4.2A11 11 0 0 1 12 4c7 0 11 8 11 8a21.3 21.3 0 0 1-3.2 4.2M1 1l22 22"/>`,
        'message': `<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 0 1 6-13c4 0 8 3 8 8z"/>`,
        'bell': `<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 0 1-4 0"/>`,
        'log-out': `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>`,
        'settings': `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`,
        'trending': `<path d="M22 7l-9 9-5-5L2 17M16 7h6v6"/>`,
        'pie': `<path d="M21.2 15A10 10 0 1 1 9 2.8M22 12A10 10 0 0 0 12 2v10z"/>`,
        'bar': `<rect x="3" y="12" width="4" height="9"/><rect x="10" y="6" width="4" height="15"/><rect x="17" y="9" width="4" height="12"/>`,
        'wallet': `<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M17 15h2"/>`,
        'credit-card': `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>`,
        'lock': `<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
        'flag': `<path d="M4 21V4M4 4h12l-2 4 2 4H4"/>`,
        'document': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>`,
        'file-check': `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 14l2 2 4-4"/>`,
        'package': `<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v10"/>`,
        'globe': `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18A14 14 0 0 1 12 3z"/>`,
        'clock': `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
        'sparkles': `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5L8 16M16 8l2.5-2.5"/>`,
        'info': `<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>`,
        'alert': `<path d="M12 2L1 21h22z"/><path d="M12 9v4M12 17h.01"/>`,
        'gift': `<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13M7 8s-1-5 5-3-5 3-5 3M17 8s1-5-5-3 5 3 5 3"/>`,
        'thumbs-up': `<path d="M7 22V11l4-8a2 2 0 0 1 3 1v6h5a2 2 0 0 1 2 2.4l-2 8a2 2 0 0 1-2 1.6H7zM2 11h5v11H2z"/>`,
        'megaphone': `<path d="M3 10v4l13 7V3L3 10zM21 8v8M16 6v12"/>`,
        'tag': `<path d="M20.6 12.6L13 20.2a2 2 0 0 1-2.8 0L3 13l1-9 9-1 7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1"/>`,
        'play': `<path d="M5 3l14 9-14 9V3z"/>`,
        'external': `<path d="M14 3h7v7M21 3l-9 9M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>`,
        'help': `<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/>`
      };
      return wrap(icons[name] || icons['help']);
    }
  };
})();
