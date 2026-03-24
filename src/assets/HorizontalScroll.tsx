import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrambleText from './ScrambleText';

gsap.registerPlugin(ScrollTrigger);

const HorizontalScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCards, setActiveCards] = useState<number[]>([]);

  useGSAP(() => {
    // 1. Initialize Lenis for smooth scrolling
    // Note: If you already have Lenis wrapping your App globally, 
    // you can remove this local instantiation.


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
          onEnter: () => setActiveCards(prev => Array.from(new Set([...prev, 0]))),
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          start: 'center center',
          end: '+=90%', // 200% of viewport height scrolling duration
        },
      });

      // Animate Green Layer
      tl.to(cards[1], {
        x: '-2vw',
        ease: 'none',
        duration: 1,
      })
      .from(cards[1].querySelector('.animated-text'), { 
        y: 50, 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power2.out',
        onStart: () => setActiveCards(prev => Array.from(new Set([...prev, 1])))
      }, "-=0.4");

      // Animate Blue Layer
      tl.to(cards[2], {
        x: '0vw',
        ease: 'none',
        duration: 1,
      })
      .from(cards[2].querySelector('.animated-text'), { 
        y: 50, 
        opacity: 0, 
        duration: 0.4, 
        ease: 'power2.out',
        onStart: () => setActiveCards(prev => Array.from(new Set([...prev, 2])))
      }, "-=0.4");
    }
  }, { scope: containerRef });

  const cardsData = [
    { 
      id: 1, 
      color: '#ffffff', 
      textColor: '#1C2B35',
      videoSrc: '/videos/bg-1.mp4', // Example path, place your video in the public/videos folder
      title: 'AI Driven Time Recording', 
      text: 'Have you already accepted having to remind your project of recording their times as unavoidable overhead? Taskable aims to trivialize time recordings unburdening your employees to reclaim their time focusing on the work that actually matters!',
      cta: 'Learn more'
    },
    { 
      id: 2, 
      color: '#ffffff', 
      textColor: '#1C2B35',
      videoSrc: '/videos/bg-2.mp4',
      title: 'Project setup at the speed of thought.', 
      text: 'Assist project managers by instantly generating structures, resource allocations, and timelines based on historical project data. Iterate on the fly, adjust parameters instantly, and get your teams executing now!',
      cta: 'See AI-assisted workflows in action →'
    },
    { 
      id: 3, 
      color: '#ffffff', 
      textColor: '#1C2B35',
      videoSrc: '/videos/bg-3.mp4',
      title: 'Deep, native ERP integration. No IT headaches.', 
      text: 'Enterprise software should break down data silos, not create them. Whether you prefer our fully managed integrations that autonomously pull and push data to your ERP, or a modern webhook/event-based architecture running through your own middleware (AWS, SAP BTP), we fit your stack. Expect flawless, out-of-the-box synchronization with SAP Cloud ERP, Workday, and Microsoft Dynamics.',
      cta: 'Read the integration documentation →'
    },
  ];

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#1C2B35',
      }}
    >
      <Box
        sx={{
          height: '92.5vh',
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
              width: index === 0 ? '100vw' : '110vw', // Extra width to prevent right-edge gaps when translated to negative x values
              height: '100%',
              zIndex: index,
              transform: index === 0 ? 'translateX(0)' : 'translateX(100vw)',
              // Drop shadow applied to parent traces the child's clipped shape
              filter: index === 0 ? 'none' : 'drop-shadow(-12px 0px 24px rgba(0, 0, 0, 0.35))',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 0,
                backgroundColor: card.color, 
                // Apply a ~7 degree skew (tan(7°) ≈ 0.122 -> 11vh / 90vh ≈ 0.122)
                clipPath: index === 0 ? 'none' : 'polygon(11vh 0, 100% 0, 100% 100%, 0 100%)',
              }}
            >
              {card.videoSrc && (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: -2, // Places it behind the text and overlay
                    // Optional: you can blend it with the card's theme color using opacity or mix-blend-mode
                    // opacity: 0.6, 
                  }}
                >
                  {/* If you add WebM versions, put the <source src="...webm" type="video/webm" /> tag first! */}
                  <source src={card.videoSrc} type="video/mp4" />
                </video>
              )}
              
              {/* Optional color overlay to ensure text remains readable over unpredictable video frames */}
              {card.videoSrc && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: card.color,
                    opacity: 0.85, // Adjust this to let more or less video show through
                    zIndex: -1,
                    mixBlendMode: 'multiply' // You can experiment with 'multiply', 'overlay', 'soft-light'
                  }}
                />
              )}

              <Box 
                className="animated-text" 
                sx={{ 
                  textAlign: 'left', 
                  color: card.textColor, 
                  // Dynamically pad the left side to safely clear the 11vh diagonal clip path across all screen sizes
                  pl: index > 0 ? { xs: 'calc(11vh + 32px)', md: 'calc(11vh + 80px)' } : { xs: 4, md: 10 },
                  pr: { xs: 4, md: 10 },
                  maxWidth: '1200px' 
                }}
              >
                <ScrambleText 
                  variant="h2" 
                  trigger={activeCards.includes(index)}
                  text={card.title}
                  sx={{ fontWeight: 700, fontSize: { xs: '36px', md: '64px' }, mb: 4, lineHeight: 1.1, letterSpacing: '-0.02em' }}
                />
                <Box sx={{ ml: { xs: 2, md: 8 }, maxWidth: '800px' }}>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontSize: { xs: '16px', md: '20px' }, mb: 4, lineHeight: 1.6 }}>{card.text}</Typography>
                  <Box
                    component="button"
                    sx={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      px: { xs: 3, md: 4 },
                      py: { xs: 1.5, md: 2 },
                      borderRadius: '50px',
                      backgroundColor: 'rgba(255, 255, 255, 0.166)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(91, 191, 181, 0.2)',
                      color: card.textColor,
                      fontFamily: 'inherit',
                      fontSize: { xs: '16px', md: '18px' },
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)', // Maps to 0.8s power2.out
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        border: '1px solid rgba(91, 191, 181, 0.4)',
                      }
                    }}
                  >
                    {card.cta}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HorizontalScroll;