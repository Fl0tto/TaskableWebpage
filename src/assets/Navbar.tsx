import { useRef, useState } from 'react';
import { Box, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Menu } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FluidSim from './FluidSim';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const [fluidVisible, setFluidVisible] = useState(false)
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // 'md' is 900px

  useGSAP(() => {
    const nav = navRef.current;
    const mm = gsap.matchMedia();

    // Setup responsive animations
    mm.add({
      isDesktop: "(min-width: 900px)",
      isMobile: "(max-width: 899px)"
    }, (context) => {
      const { isDesktop, isMobile } = context.conditions as { isDesktop: boolean, isMobile: boolean };

      ScrollTrigger.create({
        start: () => `top -${window.innerHeight * (isDesktop ? 1.1 : 0.5)}`, // Triggers earlier on mobile
        end: 99999,
        toggleClass: { targets: nav, className: 'scrolled' },
        onEnter: () => {
          // Only mount the heavy fluid effect on desktop
          if (isDesktop) setFluidVisible(true)

          gsap.to(nav, {
            backgroundColor: 'rgba(255, 255, 255, 0.166)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(91, 191, 181, 0.2)',
            duration: 0.8,
            ease: 'power2.out'
          })
          gsap.to(nav, { color: '#1A1A1A', duration: 0.4, ease: 'power2.out' })
        },
        onLeaveBack: () => {
          setFluidVisible(false)
          gsap.to(nav, {
            backgroundColor: 'transparent',
            backdropFilter: 'blur(0px)',
            border: '1px solid transparent',
            duration: 0.8,
            ease: 'power2.out'
          })
          gsap.to(nav, { color: '#C8922A', duration: 0.4, ease: 'power2.out' })
        }
      })

      if (isMobile && nav) {
        // Start at the bottom, then scrub back to the top synchronously with the Renderer exit
        gsap.fromTo(nav,
          { y: () => `calc(100svh - ${nav.offsetHeight}px - 48px)` }, // 'svh' keeps it strictly in the safe area even when the address bar is visible
          {
            y: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: document.body,
              start: '100vh top',
              end: '400vh top',
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      }
    });
  }, { scope: navRef })

  return (
    <>
      {/* Fluid sim renders behind navbar, clipped to navbar area */}
      {fluidVisible && !isMobile && (
        <Box sx={{
          position: 'fixed',
          top: 24,           // ← match navbar top exactly
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 1200,
          height: '4.5rem',        // ← match navbar pill height exactly
          zIndex: 999,
          borderRadius: '56px',
          overflow: 'hidden',    // ← this clips the fluid to the pill
          pointerEvents: 'auto'
        }}>
          <FluidSim />
        </Box>
      )}

      <Box
        sx={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          height: '4.5rem',
          width: '90%',
          maxWidth: 1200,
        }}
      >
        <Box
          ref={navRef}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            py: 2,
            px: 4,
            borderRadius: '50px',
            color: '#C8922A',
            backgroundColor: 'transparent',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', zIndex: 2 }}>
            Taskable.
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center', zIndex: 2 }}>
            <Typography variant="button" sx={{ cursor: 'pointer', color: 'inherit' }}>Features</Typography>
            <Typography variant="button" sx={{ cursor: 'pointer', color: 'inherit' }}>Philosophy</Typography>
            <Typography variant="button" sx={{ cursor: 'pointer', color: 'inherit' }}>Protocol</Typography>
          </Box>

          <IconButton sx={{ display: { xs: 'flex', md: 'none' }, color: 'inherit', zIndex: 2 }}>
            <Menu />
          </IconButton>
        </Box>
      </Box>
    </>
  )
}

export default Navbar