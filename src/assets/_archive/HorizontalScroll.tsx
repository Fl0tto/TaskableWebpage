import { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { COLORS } from '../../style';
import PricingView from './PricingView';

gsap.registerPlugin(ScrollTrigger);

const HorizontalScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCards, setActiveCards] = useState<number[]>([]);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.stacked-card');

    if (cards.length > 0) {
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
          end: '+=200%', // Re-extended slightly to give your video scrub room to breathe
        },
      });

      // Animate Green Layer
      tl.to(cards[1], {
        x: '0vw',
        ease: 'none',
        duration: 1,
        onUpdate: function(this: gsap.core.Tween) {
          const vid = cards[0].querySelector('video') as HTMLVideoElement | null;
          if (vid) {
            if (this.progress() === 1) {
              if (!vid.paused) vid.pause();
            } else {
              if (vid.paused) vid.play().catch(() => {});
            }
          }
        }
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
        y: '0vh', 
        ease: 'none',
        duration: 1,
        onUpdate: function(this: gsap.core.Tween) {
          const vid = cards[1].querySelector('video') as HTMLVideoElement | null;
          if (vid) {
            if (this.progress() === 1) {
              if (!vid.paused) vid.pause();
            } else {
              if (vid.paused) vid.play().catch(() => {});
            }
          }
        }
      }, "1") 
      .to(cards[2], {
        borderRadius: '0px', // Cleaned up back to 0px
        duration: 0.2,
        ease: 'power1.inOut',
      }, "2"); 

      // --- Re-synced Video Scrubbing ---
      // We grab the video that lives inside PricingView and sync it to the master pinned timeline
      const video3 = containerRef.current?.querySelector('.pricing-view-video') as HTMLVideoElement;
      if (video3) {
          const videoScrub = { progress: 1 }; 
          const setVideoToEnd = () => {
              if (video3.duration) {
                  video3.currentTime = video3.duration - 0.001;
                  videoScrub.progress = 1;
              }
          };
          video3.addEventListener('loadedmetadata', setVideoToEnd, { once: true });
          if (video3.readyState >= 1) setVideoToEnd();

          tl.to(videoScrub, {
              progress: 0, 
              ease: 'none',
              duration: 1.5, 
              onUpdate: () => {
                  if (video3.duration) {
                      video3.currentTime = Math.max(0.001, Math.min(videoScrub.progress * video3.duration, video3.duration - 0.001));
                  }
              }
          }, ">"); // Starts scrubbing exactly after the border radius animation finishes
      }
    }
  }, { scope: containerRef });

  const cardsData = [
    { 
      id: 1, 
      color: '#ffffff', 
      textColor: COLORS.offWhite,
      videoSrc: '/videos/bg-1.mp4', 
      titleLine1: 'AI Driven', 
      titleLine2: 'Time Recording',
      text: 'Have you already accepted having to remind your team of recording their times as unavoidable overhead? Taskable aims to trivialize time recordings unburdening your employees to reclaim their time focusing on the work that actually matters!',
    },
    { 
      id: 2, 
      color: '#ffffff', 
      textColor: COLORS.offBlack,
      videoSrc: '/videos/bg-2.mp4',
      titleLine1: 'Project setup at', 
      titleLine2: 'the speed of thought.',
      text: 'Assist project managers by instantly generating structures, resource allocations, and timelines based on historical project data. Iterate on the fly, adjust parameters instantly, and get your teams executing now!',
    },
    { 
      id: 3, 
      color: COLORS.mainBg, 
      isFullScreen: true,
      CustomComponent: PricingView,
    },
  ];

  return (
    <Box id="features" sx={{ position: 'relative' }}>
      <Box id="get-started" sx={{ position: 'absolute', top: '90vh', left: 0, pointerEvents: 'none' }} />
      <Box
        ref={containerRef}
        sx={{
          height: '100vh',
          width: '100vw',
          position: 'relative',
          backgroundColor: COLORS.mainBg,
          overflow: 'hidden',
        }}
      >
        {cardsData.map((card, index) => (
          <Box
            key={card.id}
            className="stacked-card"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: index === 1 ? '110vw' : '100vw',
              height:'100vh',
              zIndex: index,
              transform: index === 0 
                ? 'translate(0, 0)' 
                : index === 1 
                  ? 'translate(100vw, 0)' 
                  : 'translate(0, 100vh)',
              filter: index === 1 ? 'drop-shadow(-12px 0px 24px rgba(0, 0, 0, 0.35))' : index === 2 ? 'drop-shadow(0px -12px 24px rgba(0, 0, 0, 0.35))' : 'none',
              borderRadius: index === 2 ? '54px 54px 0 0' : '0',
              overflow: 'hidden',
              // WebKit mask strictly preserved to protect the UI
              WebkitMaskImage: '-webkit-radial-gradient(white, black)', 
            }}
          >
            {card.isFullScreen ? (
              <Box sx={{ width: '100%', height: '100%', backgroundColor: card.color, position: 'relative' }}>
                {card.CustomComponent && <card.CustomComponent />}
              </Box>
            ) : (
              <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                position: 'relative',
                zIndex: 0,
                backgroundColor: card.color,
                clipPath: index === 1 ? 'polygon(11vh 0, 100% 0, 100% 100%, 0 100%)' : 'none',
              }}
            >
              {card.videoSrc && (
                <video
                  ref={(el) => { if (el) el.playbackRate = 0.8; }}
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
                    zIndex: -2, 
                  }}
                >
                  <source src={card.videoSrc} type="video/mp4" />
                </video>
              )}
              
              {card.videoSrc && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: card.color,
                    opacity: 0.85, 
                    zIndex: -1,
                    mixBlendMode: 'multiply' 
                  }}
                />
              )}

              <Box 
                className="animated-text" 
                sx={{ 
                  mt: { xs: '25vh', md: '30vh' },
                  textAlign: 'left', 
                  pl: { xs: 'calc(11vh + 32px)', md: 'calc(11vh + 80px)' }, 
                  pr: index === 1 ? { xs: 'calc(10vw + 32px)', md: 'calc(10vw + 80px)' } : { xs: 4, md: 10 },
                  maxWidth: '1200px' 
                }}
              >
                <Typography variant="h2" sx={{ color: card.textColor, opacity: 0.87, fontWeight: 700, fontSize: { xs: '36px', md: '64px' }, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {card.titleLine1 || ''}
                </Typography>
                <Typography variant="h2" sx={{ color: card.textColor, opacity: 0.87, fontWeight: 700, fontSize: { xs: '36px', md: '64px' }, mb: 4, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {card.titleLine2 || ''}
                </Typography>
                <Box sx={{ position: 'relative', mt: { xs: 3, md: 4 }, maxWidth: '800px' }}>
                  <Box sx={{ position: 'absolute', top: '-1rem', bottom: '-1rem', left: 0, width: '2px', backgroundColor: card.textColor, opacity: 0.56 }} />
                  <Typography variant="body1" sx={{ color: card.textColor, opacity: 0.56, pl: { xs: 3, md: 4 }, fontSize: { xs: '16px', md: '20px' }, lineHeight: 1.6 }}>
                    {card.text}
                  </Typography>
                </Box>
              </Box>
            </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HorizontalScroll;