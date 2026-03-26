import React from 'react'
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../colors';
import Button from './Button';

interface PricingCardProps {
  title?: string;
  price?: string;
  buttonText?: string;
  features?: string[];
  highlight?: boolean;
  onClick?: () => void; // Optional overrides layout per-screen
}

const PricingCard = ({
    title = "Plan", 
    price = "$XX", 
    buttonText = "Choose", 
    features = ["One feature", "Another feature"], 
    highlight = false, 
    onClick 
}: PricingCardProps) => {
    
    return(
        <Box sx={{padding: '15rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}> 
            <Box sx={{
                width: '22rem',
                minHeight: '16rem',
                p: '0',
                borderRadius: '56px',
                border: `1px solid ${COLORS.mainBg}`,
                bgcolor: COLORS.offWhite,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1.5rem 3rem rgba(200, 146, 42, 0.15)',
                overflow: 'hidden' // Ensure content respects the large border radius
            }}>
                <Box sx={{
                    p: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: highlight ? `linear-gradient(to bottom, ${COLORS.mainAccent}, ${COLORS.tertAccent})` : `linear-gradient(to bottom, ${COLORS.offWhite}, ${COLORS.offGrey})`,
                    textAlign: 'center',
                }}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: '600', color: COLORS.offBlack, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</Typography>
                    <Typography sx={{ fontSize: '3.5rem', fontWeight: '800', color: COLORS.offBlack, my: '1rem', lineHeight: 1 }}>{price}</Typography>
                    <Button 
                        buttonType={highlight ? 'Highlight' : 'Active'} 
                        text={buttonText} 
                        onClick={onClick} 
                        sx={{
                            width: '100%',
                            ...(!highlight && { // Custom styles for non-highlighted card button
                                color: COLORS.offBlack,
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                borderColor: 'rgba(0, 0, 0, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                }
                            })
                        }}
                    />
                </Box>
                <Box sx={{ p: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexGrow: 1 }}>
                    {features.map((feature, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Typography sx={{ color: COLORS.mainAccent, fontSize: '1.25rem', lineHeight: 1 }}>✔</Typography>
                            <Typography sx={{ fontSize: '1rem', color: 'rgba(0,0,0,0.6)' }}>{feature}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    )
}

export default PricingCard