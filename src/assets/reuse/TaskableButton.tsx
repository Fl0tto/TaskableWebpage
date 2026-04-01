import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { THEME, FONTS } from '../../style';

// ─── Public API ───────────────────────────────────────────────────────────────
// Only these four props are accessible from outside. All visual decisions
// live exclusively inside this file.

export type TaskableButtonType = 'Highlight' | 'Active' | 'Disabled' | 'Custom';

interface TaskableButtonProps {
  buttonType: TaskableButtonType;
  text: string;
  onClick?: () => void;
  icon?: ReactNode;       // optional — renders no icon by default
}

// ─── Corner cross ─────────────────────────────────────────────────────────────
// Each corner is a small + shape (two 1px lines) positioned at the rectangular
// boundary of the button, shown only on hover.

const ARM = 6; // px — length of a single arm from the cross center

const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const isTop  = pos[0] === 't';
  const isLeft = pos[1] === 'l';

  return (
    <Box
      className="taskable-corner"
      sx={{
        position: 'absolute',
        ...(isTop  ? { top: 0 }    : { bottom: 0 }),
        ...(isLeft ? { left: 0 }   : { right: 0  }),
        width:  ARM * 2,
        height: ARM * 2,
        // Center the cross on the corner point
        transform: `translate(${isLeft ? '-50%' : '50%'}, ${isTop ? '-50%' : '50%'})`,
        opacity: 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
        // Horizontal bar
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '1px',
          backgroundColor: THEME.accent,
          transform: 'translateY(-50%)',
        },
        // Vertical bar
        '&::after': {
          content: '""',
          position: 'absolute',
          left: '50%',
          top: 0,
          height: '100%',
          width: '1px',
          backgroundColor: THEME.accent,
          transform: 'translateX(-50%)',
        },
      }}
    />
  );
};

// ─── Per-type style config ────────────────────────────────────────────────────
// Everything visual is defined here. Nothing leaks out to callers.

const TYPE_STYLES = {

  // Primary CTA — filled, high contrast (e.g. hero "Get Started")
  Highlight: {
    bg:          THEME.textPrimary,
    color:       THEME.bg,
    border:      `1.5px solid ${THEME.textPrimary}`,
    hoverBg:     '#252525',
    hoverBorder: `1.5px solid #252525`,
    cornerColor: THEME.bg,
  },

  // Secondary CTA — outlined, transparent fill (e.g. hero "Learn More")
  Active: {
    bg:          'transparent',
    color:       THEME.textPrimary,
    border:      `1.5px solid ${THEME.border}`,
    hoverBg:     THEME.surface,
    hoverBorder: `1.5px solid ${THEME.textMuted}`,
    cornerColor: THEME.textPrimary,
  },

  // Non-interactive — very low contrast, conveys unavailability
  Disabled: {
    bg:          'transparent',
    color:       THEME.textMuted,
    border:      `1.5px solid ${THEME.border}`,
    hoverBg:     'transparent',           // no hover state
    hoverBorder: `1.5px solid ${THEME.border}`,
    cornerColor: THEME.textMuted,
  },

  // Custom — intentionally unstyled placeholder, define when needed
  Custom: {
    bg:          'transparent',
    color:       THEME.textSecondary,
    border:      `1.5px dashed ${THEME.border}`,
    hoverBg:     THEME.surface,
    hoverBorder: `1.5px dashed ${THEME.textMuted}`,
    cornerColor: THEME.textSecondary,
  },

} as const;

// ─── Component ────────────────────────────────────────────────────────────────

// Shared typographic constants — ghost and button must match exactly
const BTN_FONT_SIZE    = '0.9375rem';
const BTN_FONT_WEIGHT  = 600;
const BTN_PX           = '1.75rem';
const BTN_PY           = '0.8125rem';
const BTN_LS_DEFAULT   = '0.015em';
const BTN_LS_HOVER     = '0.07em';   // hover letter-spacing — ghost reserves this width

const TaskableButton = ({ buttonType, text, onClick, icon }: TaskableButtonProps) => {
  const isDisabled = buttonType === 'Disabled';
  const s = TYPE_STYLES[buttonType];

  return (
    // Outer wrapper: inline-grid so the ghost and button share one cell.
    // The ghost is always rendered at hover letter-spacing, locking the cell
    // to the widest possible size — the real button fills that fixed cell,
    // so letter-spacing changes never shift surrounding elements.
    <Box
      sx={{
        position: 'relative',
        display: 'inline-grid',
        color: s.cornerColor,
        ...(!isDisabled && {
          '&:hover .taskable-corner': { opacity: 1 },
        }),
      }}
    >
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />

      {/* ── Ghost sizer ──────────────────────────────────────────────────────
          Invisible, never interactive. Sits in cell 1/1, rendered at the
          hover letter-spacing so the grid column is always pre-sized to the
          button's maximum width. Border is transparent to match box-model. */}
      <Box
        aria-hidden
        sx={{
          gridArea: '1/1',
          visibility: 'hidden',
          pointerEvents: 'none',
          fontFamily: FONTS.body,
          fontSize: BTN_FONT_SIZE,
          fontWeight: BTN_FONT_WEIGHT,
          letterSpacing: BTN_LS_HOVER,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: icon ? '0.5rem' : 0,
          px: BTN_PX,
          py: BTN_PY,
          border: '1.5px solid transparent',
        }}
      >
        {icon}{text}
      </Box>

      {/* ── Real button ──────────────────────────────────────────────────── */}
      <Box
        component="button"
        onClick={!isDisabled ? onClick : undefined}
        sx={{
          // ── Sizing: fills the grid cell the ghost already locked ───────────
          gridArea: '1/1',
          width: '100%',

          // ── Browser reset ──────────────────────────────────────────────────
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',

          // ── Typography ─────────────────────────────────────────────────────
          fontFamily: FONTS.body,
          fontSize: BTN_FONT_SIZE,
          fontWeight: BTN_FONT_WEIGHT,
          letterSpacing: BTN_LS_DEFAULT,
          lineHeight: 1,
          whiteSpace: 'nowrap',

          // ── Layout ─────────────────────────────────────────────────────────
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: icon ? '0.5rem' : 0,

          // ── Shape ──────────────────────────────────────────────────────────
          borderRadius: '2rem',
          px: BTN_PX,
          py: BTN_PY,

          // ── Colors ─────────────────────────────────────────────────────────
          backgroundColor: s.bg,
          color: s.color,
          border: s.border,

          // ── Cursor ─────────────────────────────────────────────────────────
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',

          // ── Transitions ────────────────────────────────────────────────────
          transition: [
            'background-color 0.22s ease',
            'border-color 0.22s ease',
            'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            'letter-spacing 0.3s ease',
            'transform 0.1s ease',
          ].join(', '),

          // ── Hover & click states (non-Disabled only) ───────────────────────
          ...(!isDisabled && {
            '&:hover': {
              backgroundColor: s.hoverBg,
              border: s.hoverBorder,
              borderRadius: '1rem',
              letterSpacing: BTN_LS_HOVER,
            },
            '&:active': {
              transform: 'scale(0.96)',
              transition: 'transform 0.08s ease',
            },
          }),
        }}
      >
        {icon}
        {text}
      </Box>
    </Box>
  );
};

export default TaskableButton;
