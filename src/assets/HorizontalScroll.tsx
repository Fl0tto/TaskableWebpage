import { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis'; // Make sure to install: npm install lenis

gsap.registerPlugin(ScrollTrigger);

const HorizontalScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Initialize Lenis for smooth scrolling
    // Note: If you already have Lenis wrapping your App globally, 
    // you can remove this local instantiation.
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // 2. Stacked Scroll Logic
    const cards = gsap.utils.toArray<HTMLElement>('.stacked-card');

    if (cards.length > 0) {
      // Red card text animation on initial view
      gsap.from(cards[0].querySelector('.animated-text'), {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          start: 'center center',
          end: '+=200%', // 200% of viewport height scrolling duration
        },
      });

      // Animate Green Layer to x: 3vw
      tl.to(cards[1], {
        x: '3vw',
        ease: 'none',
        duration: 1,
      })
      .from(cards[1].querySelector('.animated-text'), { y: 50, opacity: 0, duration: 0.4, ease: 'power2.out' }, "-=0.4");

      // Animate Blue Layer to x: 6vw
      tl.to(cards[2], {
        x: '6vw',
        ease: 'none',
        duration: 1,
      })
      .from(cards[2].querySelector('.animated-text'), { y: 50, opacity: 0, duration: 0.4, ease: 'power2.out' }, "-=0.4");
    }

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, { scope: containerRef });

  const cardsData = [
    { id: 1, title: 'Red Layer', color: '#ff4d4d', text: 'This is the foundational layer.' },
    { id: 2, title: 'Green Layer', color: '#4caf50', text: 'Stacks over the red layer, leaving 3% visible.' },
    { id: 3, title: 'Blue Layer', color: '#2196f3', text: 'Stacks over the green layer with a 7-degree skew.' },
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#1C2B35',
      }}
    >
      <Box
        sx={{
          height: '90vh',
          width: '100vw',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {cardsData.map((card, index) => (
          <Box
            key={card.id}
            className="stacked-card"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: card.color,
              zIndex: index,
              transform: index === 0 ? 'translateX(0)' : 'translateX(100vw)',
              // Apply a ~7 degree skew (tan(7°) ≈ 0.122 -> 11vh / 90vh ≈ 0.122)
              clipPath: index === 0 ? 'none' : 'polygon(11vh 0, 100% 0, 100% 100%, 0 100%)',
            }}
          >
            <Box className="animated-text" sx={{ textAlign: 'center', color: '#fff', px: 4, ml: index > 0 ? '5.5vh' : 0 }}>
              <Typography variant="h2" sx={{ fontWeight: 800, mb: 2 }}>{card.title}</Typography>
              <Typography variant="h5" sx={{ opacity: 0.9 }}>{card.text}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HorizontalScroll;