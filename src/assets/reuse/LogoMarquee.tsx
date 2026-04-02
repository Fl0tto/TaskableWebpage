import { Box, Typography } from '@mui/material';
import { useRef, useEffect } from 'react';
import { THEME, TEXT_STYLES } from '../../style';

// Width of each logo card (px) + gap between cards
const ITEM_WIDTH = 200;
const GAP = 32;
const SLOT = ITEM_WIDTH + GAP; // total space one card occupies

// Speed kept identical to the old CSS animation: 1 slot per 1.2s
const SPEED_PX_PER_SEC = SLOT / 3; // ≈ 193 px/s

// Lerp factor applied each frame (60 fps assumed for the ease curve).
// 0.08 → reaches ~95 % of target in ~37 frames (≈ 0.6 s) — visibly damped.
const LERP = 0.08;

export interface LogoEntry {
  /** Display name shown beneath the logo */
  name: string;
  /** Any renderable content: <img>, <svg>, a component, etc. */
  logo: React.ReactNode;
}

interface LogoMarqueeProps {
  logos: LogoEntry[];
  /** Optional section label rendered above the strip */
  label?: string;
}

const LogoMarquee = ({ logos, label }: LogoMarqueeProps) => {
  // Duplicate the list so the strip loops seamlessly
  const doubled = [...logos, ...logos];
  // translateX wrap point = width of the original (non-duplicated) strip
  const trackOffset = logos.length * SLOT;

  const trackRef   = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);           // avoids stale closure in the RAF loop
  const posRef     = useRef(0);               // current translateX in px
  const velRef     = useRef(SPEED_PX_PER_SEC);// current velocity in px/s
  const lastRef    = useRef<number | null>(null);

  useEffect(() => {
    let rafId: number;

    const animate = (now: number) => {
      // Delta time in seconds, capped at 50 ms to survive tab-suspension glitches
      const dt = lastRef.current === null ? 0 : Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;

      // Lerp velocity toward target each frame
      const targetVel = hoveredRef.current ? 0 : SPEED_PX_PER_SEC;
      velRef.current  += (targetVel - velRef.current) * LERP;

      // Advance position and wrap
      posRef.current -= velRef.current * dt;
      if (posRef.current <= -trackOffset) posRef.current += trackOffset;
      if (posRef.current >  0)            posRef.current -= trackOffset;

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [trackOffset]);

  // Shared gradient fade width
  const FADE_WIDTH = 200;

  return (
    <Box
      component="section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: THEME.bgAlt,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {label && (
        <Box sx={{ px: { xs: 3, md: 10 }, mb: 6, maxWidth: 1200, mx: 'auto' }}>
          <Typography
            sx={{
              ...TEXT_STYLES.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {label}
          </Typography>
        </Box>
      )}

      {/* Animated strip — transform driven by RAF loop via ref */}
      <Box
        ref={trackRef}
        onMouseEnter={() => { hoveredRef.current = true; }}
        onMouseLeave={() => { hoveredRef.current = false; }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'default',
          willChange: 'transform',
        }}
      >
        {doubled.map((item, i) => (
          <Box
            key={i}
            sx={{
              width: `${ITEM_WIDTH}px`,
              flexShrink: 0,
              mr: `${GAP}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {/* Logo slot — 64×64 centred */}
            <Box
              sx={{
                width: '6rem',
                height: '6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: THEME.textPrimary,
                '& img': { width: '100%', height: '100%', objectFit: 'contain' },
                '& svg': { width: '100%', height: '100%' },
              }}
            >
              {item.logo}
            </Box>

            {/* Name */}
            <Typography
              sx={{
                ...TEXT_STYLES.muted,
                fontWeight: 500,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {item.name}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Left fade */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${FADE_WIDTH}px`,
          background: `linear-gradient(to right, ${THEME.bgAlt}, transparent)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      {/* Right fade */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${FADE_WIDTH}px`,
          background: `linear-gradient(to left, ${THEME.bgAlt}, transparent)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default LogoMarquee;
