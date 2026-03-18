import { useRef, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Menu } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FluidSim from './FluidSim';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const [fluidVisible, setFluidVisible] = useState(false)

  useGSAP(() => {
    const nav = navRef.current;

    ScrollTrigger.create({
      start: () => `top -${window.innerHeight * 1.1}`,
      end: 99999,
      toggleClass: { targets: nav, className: 'scrolled' },
      onEnter: () => {
        setFluidVisible(true)  // ← mount fluid when navbar becomes visible
        gsap.to(nav, {
          backgroundColor: 'rgba(255, 255, 255, 0.166)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(91, 191, 181, 0.2)',
          duration: 0.8,
          ease: 'power2.out'
        })
        gsap.to(nav, {
          color: '#1A1A1A',
          duration: 0.4,
          ease: 'power2.out'
        })
      },
      onLeaveBack: () => {
        setFluidVisible(false)  // ← unmount fluid when scrolling back to top
        gsap.to(nav, {
          backgroundColor: 'transparent',
          backdropFilter: 'blur(0px)',
          border: '1px solid transparent',
          duration: 0.8,
          ease: 'power2.out'
        })
        gsap.to(nav, {
          color: '#C8922A',
          duration: 0.4,
          ease: 'power2.out'
        })
      }
    })
  }, { scope: navRef })

  return (
    <>
      {/* Fluid sim renders behind navbar, clipped to navbar area */}
      {fluidVisible && (
        <Box sx={{
          position: 'fixed',
          top: '24px',           // ← match navbar top exactly
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 1200,
          height: '56px',        // ← match navbar pill height exactly
          zIndex: 999,
          borderRadius: '50px',
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
          width: '90%',
          maxHeight: '2rem',
          maxWidth: 1200,
        }}
      >
        <Box
          ref={navRef}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 4,
            py: 2,
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