import React from 'react'
import { Box, Typography } from '@mui/material';
import { COLORS } from '../../colors';
import Button from './Button';

interface PricingCardProps {
  title?: string;
  price?: string;
  buttonText?: string;
  highlight?: boolean;
  onClick?: () => void; // Optional overrides layout per-screen
}

const PricingCard = ({title = "Plan", price = "$XX", buttonText = "Choose", highlight = false, onClick }: PricingCardProps) => {
    
    return(
        <Box sx={{padding: '15rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}> 
            <Box sx={{
                width: '20rem',
                height: '16rem',
                p: '0',
                borderRadius: '56px',
                border: `1px solid ${COLORS.mainBg}`,
                bgcolor: COLORS.offWhite,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1.5rem 3rem rgba(200, 146, 42, 0.15)'
            }}>
                <Box sx={{
                    p: '1.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    background: highlight ? `linear-gradient(to bottom, ${COLORS.mainAccent}, ${COLORS.tertAccent})` : `linear-gradient(to bottom, ${COLORS.offWhite}, ${COLORS.offGrey})`,
                    borderTopLeftRadius: '56px',
                    borderTopRightRadius: '56px',
                    position: 'relative',
                    height: '10rem'
                }}>
                    <Typography sx={{fontSize: '2rem', fontWeight: '700', color:COLORS.offBlack}}>{title}</Typography>
                    <Typography sx={{fontSize: '1.5rem', fontWeight: '500', color:COLORS.offBlack, mt: 0.5}}>{price}</Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default PricingCard