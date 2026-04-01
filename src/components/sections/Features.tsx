import { Box, Typography } from '@mui/material';
import { TEXT_STYLES, THEME } from '../../style';

// TODO: Replace with real feature data
const featuresData = [
  {
    id: 1,
    label: 'Feature One',
    heading: 'Feature heading goes here',
    body: 'A clear, benefit-focused description of this feature. Explain what problem it solves, not just what it does.',
  },
  {
    id: 2,
    label: 'Feature Two',
    heading: 'Another feature heading',
    body: 'A clear, benefit-focused description of this feature. Explain what problem it solves, not just what it does.',
  },
  {
    id: 3,
    label: 'Feature Three',
    heading: 'Third feature heading',
    body: 'A clear, benefit-focused description of this feature. Explain what problem it solves, not just what it does.',
  },
];

const Features = () => {
  return (
    <Box
      component="section"
      id="features"
      sx={{
        py: { xs: 10, md: 16 },
        px: { xs: 3, md: 10 },
        backgroundColor: THEME.bgAlt,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

        {/* Section label + heading */}
        <Typography sx={{ ...TEXT_STYLES.muted, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
          Features
        </Typography>
        <Typography sx={{ ...TEXT_STYLES.h1, mb: { xs: 8, md: 12 }, maxWidth: 640 }}>
          {/* TODO: Replace with a concise section headline */}
          What Taskable does for your team.
        </Typography>

        {/* Feature rows */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 10, md: 14 } }}>
          {featuresData.map((feature, index) => (
            <Box
              key={feature.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: { xs: 4, md: 10 },
                alignItems: 'center',
                direction: index % 2 !== 0 ? 'rtl' : 'ltr',
              }}
            >
              {/* Text */}
              <Box sx={{ direction: 'ltr' }}>
                <Typography sx={{ ...TEXT_STYLES.muted, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
                  {feature.label}
                </Typography>
                <Typography sx={{ ...TEXT_STYLES.h2, mb: 3 }}>
                  {feature.heading}
                </Typography>
                <Typography sx={TEXT_STYLES.body}>
                  {feature.body}
                </Typography>
              </Box>

              {/* Visual placeholder */}
              <Box
                sx={{
                  direction: 'ltr',
                  aspectRatio: '16 / 10',
                  backgroundColor: THEME.surface,
                  borderRadius: '16px',
                  border: `1px solid ${THEME.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={TEXT_STYLES.muted}>Visual / screenshot here</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Features;
