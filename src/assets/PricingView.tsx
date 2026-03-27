import React, { useRef, useState } from 'react';
import { Box, useMediaQuery, useTheme, IconButton } from '@mui/material';
import { ArrowRightCircle } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { COLORS } from '../colors';
import PricingCard from './reuse/PricingCard';

gsap.registerPlugin(ScrollTrigger);

const PricingView = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<HTMLDivElement[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null); // Added ref for the video
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const pricingCardsData = [
        {
            title: "Trial",
            price: "Free",
            features: ["Free 14 day Trial", "No credit card info required"],
            highlight: false,
        },
        {
            title: "Pro",
            price: "9€/Month per User",
            features: ["Full access to all features", "Get going today"],
            highlight: true,
        },
        {
            title: "Enterprise",
            price: "Custom",
            buttonText: "Request a Quote",
            features: ["Implementation & Integration support", "Priority access", "Optional multi tenant structure"],
            highlight: false,
        }
    ];

    const [activeCard, setActiveCard] = useState(0);

    const handleNextCard = () => {
        if (gsap.isTweening(cardRefs.current)) return;

        const currentIndex = activeCard;
        const nextIndex = (currentIndex + 1) % pricingCardsData.length;
        const upcomingIndex = (nextIndex + 1) % pricingCardsData.length;

        const currentEl = cardRefs.current[currentIndex];
        const nextEl = cardRefs.current[nextIndex];
        const upcomingEl = cardRefs.current[upcomingIndex];

        gsap.timeline({ onComplete: () => setActiveCard(nextIndex) })
            .set(currentEl, { zIndex: 8 })
            .set(nextEl,    { zIndex: 10 })
            .set(upcomingEl,{ zIndex: 12  })
            .to(currentEl,  { y: '-150%', rotation: -10, duration: 0.6, ease: 'power2.in' })
            .to(nextEl,     { y: 0, scale: 1, rotation: 0, duration: 0.5, ease: 'power2.out' }, '-=0.4')
            .fromTo(upcomingEl,
                { y: '200vh' },
                { y: '3%', scale: 0.97, rotation: 2, duration: 0.5, ease: 'power2.out' }, '<'
            )
            .set(currentEl, { y: '200vh', rotation: 0, zIndex: 6 });
    };

    useGSAP(() => {
        // --- 1. Cards Setup ---
        cardRefs.current.forEach((card, index) => {
            gsap.set(card, { position: 'absolute', top: 0, left: 0, transformOrigin: 'center center', width: '100%', force3D: true });
            if (index === 0) { 
                gsap.set(card, { y: 0, scale: 1, rotation: 0, zIndex: 10 });
            } else if (index === 1) { 
                gsap.set(card, { y: '3%', scale: 0.97, rotation: 2, zIndex: 8 });
            } else { 
                gsap.set(card, { y: '150%', zIndex: 6 });
            }
        });

        // --- 2. Decoupled Video Scrubbing ---
        const video = videoRef.current;
        if (video) {
            const videoScrub = { progress: 1 };
            const setVideoToEnd = () => {
                if (video.duration) {
                    video.currentTime = video.duration - 0.001;
                    videoScrub.progress = 1;
                }
            };
            
            video.addEventListener('loadedmetadata', setVideoToEnd, { once: true });
            if (video.readyState >= 1) setVideoToEnd();

            gsap.to(videoScrub, {
                progress: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#get-started', // Using your anchor perfectly!
                    start: 'top center', // Adjust this if you want the scrub to start sooner/later
                    end: '+=150%', // Defines the total scroll length for the video scrub
                    scrub: 1,
                },
                onUpdate: () => {
                    if (video.duration) {
                        video.currentTime = Math.max(0.001, Math.min(videoScrub.progress * video.duration, video.duration - 0.001));
                    }
                }
            });
        }

    }, { scope: containerRef, dependencies: [isMobile] });

    return (
        <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: COLORS.mainBg }}>
            <Box
                component="video"
                ref={videoRef} // Attached the ref here!
                muted
                playsInline
                preload="auto"
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: { xs: '0% 50%', md: '50% 50%' },
                    zIndex: -1, 
                    isolation: 'isolate'
                }}
            >
                <source src="/videos/bg-3.mp4" type="video/mp4" />
            </Box>

            <Box sx={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                height: '90%',
                top: '20%',
                display: 'flex',
                alignItems: 'center',
                transform: 'translateZ(0px)',
                transformStyle: 'preserve-3d', 
                justifyContent: { xs: 'center', md: 'flex-end' },
            }}>
                <Box sx={{
                    width: { xs: '90%', md: '66.66%' },
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    transform: { xs: 'translateX(-10%)', md: 'none' },
                    pr: { md: '5%' },
                    mt: { xs: '8rem', md: 0 },
                    transformStyle: 'preserve-3d', 
                }}>
                    <Box sx={{ position: 'relative', width: { xs: '17rem', md: '22rem' }, height: { xs: '36rem', md: '42rem' }, transformStyle: 'preserve-3d' }}>
                        {pricingCardsData.map((card, index) => (
                            <Box
                                key={index}
                                ref={(el: HTMLDivElement | null) => { if (el) cardRefs.current[index] = el; }}
                                className="pricing-card-container"
                                sx={{ willChange: 'transform' }} 
                            >
                                <PricingCard {...card} />
                            </Box>
                        ))}
                        <IconButton
                            onClick={handleNextCard}
                            sx={{
                                position: 'absolute',
                                top: '40%',
                                right: { xs: '-4rem', md: '-6rem' },
                                transform: 'translateY(-50%) translateZ(10px)', 
                                willChange: 'transform',
                                color: COLORS.offWhite,
                                zIndex: 20, 
                                '&:hover': {
                                    color: COLORS.mainAccent
                                }
                            }}
                        >
                            <ArrowRightCircle size={48} />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PricingView;