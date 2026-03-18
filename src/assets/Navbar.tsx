import { useRef } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { Menu } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const navRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Scroll morphing logic for Navbar
    const nav = navRef.current;
    
    ScrollTrigger.create({
      start: 'top -50',
      end: 99999,
      toggleClass: {
        targets: nav,
        className: 'scrolled'
      },
      onEnter: () => {
        gsap.to(nav, {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(91, 191, 181, 0.2)',
          color: '#1A1A1A', // Sky Teal text on scroll
          duration: 0.4,
          ease: 'power2.out'
        });
      },
      onLeaveBack: () => {
        gsap.to(nav, {
          backgroundColor: 'transparent',
          backdropFilter: 'blur(0px)',
          border: '1px solid transparent',
          color: '#C8922A', // Text Dark initially (or white if hero is dark? Prompt says: "Transparent with white text at the hero top. Transitions into a White/60 glassmorphic blur with Sky Teal text" -> let's make it white initially)
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });
  }, { scope: navRef });

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        height: '10%',
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
          color: '#C8922A', // Initial top color
          transition: 'color 0.4s',
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
  );
};

export default Navbar;
