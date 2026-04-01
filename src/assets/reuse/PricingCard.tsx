import { Box, Typography } from '@mui/material';
import { THEME, FONTS } from '../../style';
import TaskableButton from './TaskableButton';

interface PricingCardProps {
  title?: string;
  price?: string;
  buttonText?: string;
  features?: string[];
  highlight?: boolean;
  onClick?: () => void;
}

const PricingCard = ({
  title    = 'Plan',
  price    = '—',
  buttonText = 'Choose',
  features = ['One feature', 'Another feature'],
  highlight = false,
  onClick,
}: PricingCardProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '20px',
        border: highlight
          ? `1.5px solid ${THEME.textPrimary}`
          : `1.5px solid ${THEME.border}`,
        backgroundColor: THEME.bg,
        overflow: 'hidden',
        boxShadow: highlight
          ? '0 8px 40px rgba(0, 0, 0, 0.10)'
          : '0 2px 12px rgba(0, 0, 0, 0.04)',
        transition: 'box-shadow 0.22s ease',
        '&:hover': {
          boxShadow: highlight
            ? '0 12px 48px rgba(0, 0, 0, 0.14)'
            : '0 6px 24px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: '2rem',
          borderBottom: `1px solid ${THEME.border}`,
          backgroundColor: highlight ? THEME.bgAlt : THEME.bg,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Plan label */}
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: highlight ? THEME.textPrimary : THEME.textMuted,
          }}
        >
          {title}
        </Typography>

        {/* Price */}
        <Typography
          sx={{
            fontFamily: FONTS.heading,
            fontSize: { xs: '2rem', md: '2.25rem' },
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: THEME.textPrimary,
          }}
        >
          {price}
        </Typography>

        {/* CTA */}
        <TaskableButton
          buttonType={highlight ? 'Highlight' : 'Active'}
          text={buttonText}
          onClick={onClick}
        />
      </Box>

      {/* ── Feature list ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          flexGrow: 1,
        }}
      >
        {features.map((feature, index) => (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}
          >
            <Typography
              sx={{
                fontFamily: FONTS.body,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: THEME.textPrimary,
                flexShrink: 0,
                lineHeight: 1.5,
              }}
            >
              ✓
            </Typography>
            <Typography
              sx={{
                fontFamily: FONTS.body,
                fontSize: { xs: '0.875rem', md: '0.9375rem' },
                color: THEME.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {feature}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PricingCard;
