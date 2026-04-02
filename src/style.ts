// ─── Legacy theme colors (kept for archived 3D components) ───────────────────
export const COLORS = {
  offBlack: '#131007',
  offWhite: '#F9F6EE',
  offGrey: '#e0ded7',
  mainBg: '#1C2B35',
  mainAccent: '#C8922A',
  secAccent: '#DDAE51',
  tertAccent: '#FFD686',
};

// ─── Clean light theme ────────────────────────────────────────────────────────
export const THEME = {
  bg:            '#FFFFFF',   // page background
  bgAlt:         '#F8F8F8',   // subtle alternate background (sections, cards)
  surface:       '#F2F2F2',   // elevated surfaces, input backgrounds
  border:        '#E4E4E4',   // dividers, card borders
  textPrimary:   '#0A0A0A',   // headings, high-emphasis text
  textSecondary: '#525252',   // body text, descriptions
  textMuted:     '#A3A3A3',   // captions, labels, placeholders
  accent:        '#C8922A',  // CTA buttons, highlights — reuse legacy accent
};

// ─── Fonts ────────────────────────────────────────────────────────────────────
export const FONTS = {
  heading: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  body:    "'Inter', 'Helvetica Neue', Arial, sans-serif",
  mono:    "'JetBrains Mono', 'Courier New', Courier, monospace",
};

// ─── Text styles (MUI sx-compatible) ─────────────────────────────────────────
// Usage: <Typography sx={TEXT_STYLES.heroHeading}>...</Typography>
export const TEXT_STYLES = {

  // Large hero headline — the most prominent text on the page
  heroHeading: {
    fontFamily: FONTS.heading,
    fontSize: { xs: '3.25rem', md: '5.5rem', lg: '7rem' },
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.03em',
    color: THEME.textPrimary,
  },

  // Primary section headings (h1-level)
  h1: {
    fontFamily: FONTS.heading,
    fontSize: { xs: '2.25rem', md: '3rem' },
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    color: THEME.textPrimary,
  },

  // Sub-section headings (h2-level)
  h2: {
    fontFamily: FONTS.heading,
    fontSize: { xs: '1.625rem', md: '2.25rem' },
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    color: THEME.textPrimary,
  },

  // Card titles, smaller section labels (h3-level)
  h3: {
    fontFamily: FONTS.heading,
    fontSize: { xs: '1.125rem', md: '1.375rem' },
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
    color: THEME.textPrimary,
  },

  // Default body / paragraph text
  body: {
    fontFamily: FONTS.body,
    fontSize: { xs: '1rem', md: '1.125rem' },
    fontWeight: 400,
    lineHeight: 1.75,
    color: THEME.textSecondary,
  },

  // Low-visibility text — captions, helper text, fine print
  muted: {
    fontFamily: FONTS.body,
    fontSize: { xs: '0.8125rem', md: '0.9375rem' },
    fontWeight: 400,
    lineHeight: 1.6,
    color: THEME.textMuted,
  },
};
