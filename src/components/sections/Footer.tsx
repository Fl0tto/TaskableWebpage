import { Box, Typography } from '@mui/material';
import { TEXT_STYLES, THEME } from '../../style';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: `1px solid ${THEME.border}`,
        py: { xs: 6, md: 8 },
        px: { xs: 3, md: 10 },
        backgroundColor: THEME.bg,
      }}
    >
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 4,
        }}
      >
        {/* Logo / brand */}
        <Typography sx={{ ...TEXT_STYLES.h3, fontWeight: 800 }}>
          Taskable.
        </Typography>

        {/* TODO: Add footer nav links */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {['Features', 'Pricing', 'About'].map((link) => (
            <Typography key={link} sx={{ ...TEXT_STYLES.muted, cursor: 'pointer', '&:hover': { color: THEME.textSecondary } }}>
              {link}
            </Typography>
          ))}
        </Box>

        {/* Copyright */}
        <Typography sx={TEXT_STYLES.muted}>
          © {new Date().getFullYear()} Taskable. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
