import { useMediaQuery, useTheme, Box, Typography } from '@mui/material';
import { TEXT_STYLES, THEME } from '../../style';
import TaskableButton from '../../assets/reuse/TaskableButton';
import Renderer from '../../assets/reuse/Renderer'

const Hero = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    // 200vh tall section — gives the camera scroll animation its scroll range.
    // The sticky shell stays locked at the top while the parent scrolls through
    // the extra 100vh, then unsticks and the next section scrolls in normally.
    <Box component="section" id="hero" sx={{ height: isMobile ? '100vh' : '200vh' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          backgroundColor: THEME.bg,
          pointerEvents: 'none',
        }}
      >
        {/* 3D background — absolutely fills the sticky shell */}
        {!isMobile &&<Box sx={{ position: 'absolute', inset: 0 }}>
          <Renderer />
        </Box>}

        {/* Content — sits on top of the canvas */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            px: { xs: 3, md: 10 },
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <Box sx={{ maxWidth: 800 }}>
            {/* TODO: Replace placeholder with final headline */}
            <Typography sx={TEXT_STYLES.heroHeading}>
              Reclaim <br />your Time.
            </Typography>

            {/* TODO: Replace with a clear one-sentence description of what Taskable does */}
            <Typography sx={{ ...TEXT_STYLES.body, mt: 4, maxWidth: 560 }}>
              Have you resigned to accepting late time recordings and cost overruns as an unavoidable part of project management?
            </Typography>

            {/* CTA buttons */}
            <Box sx={{ mt: 6, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', pointerEvents: 'auto' }}>
              <TaskableButton buttonType="Highlight" text="Get Started" />
              <TaskableButton buttonType="Active" text="Learn More" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Hero;
