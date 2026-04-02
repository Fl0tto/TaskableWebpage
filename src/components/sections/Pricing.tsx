import { Box, Typography } from '@mui/material';
import { TEXT_STYLES, THEME } from '../../style';
import {useState} from 'react'
import PricingCard from '../../assets/reuse/PricingCard';
import RequestTenantPopup from '../../assets/reuse/RequestTenantPopup';

const Pricing = () => {
  const [popupOpen, setPopupOpen] = useState(false);

  // TODO: Review and finalise pricing data
  const pricingData = [
    {
      title: 'Trial',
      price: 'Free',
      buttonText: 'Start for free',
      features: ['14-day free trial', 'No credit card required'],
      highlight: false,
      onClick: () => setPopupOpen(true),
    },
    {
      title: 'Pro',
      price: '9€ / month',
      buttonText: 'Get started',
      features: ['Full access to all features', 'Get going today', 'Price per user'],
      highlight: true,
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      buttonText: 'Request a quote',
      features: ['Implementation & integration support', 'Priority access', 'Fully custom pricing model'],
      highlight: false,
    },
  ];

  return (
    <Box
      component="section"
      id="pricing"
      sx={{
        py: { xs: 10, md: 16 },
        px: { xs: 3, md: 10 },
        backgroundColor: THEME.bg,
      }}
    >
      <RequestTenantPopup open={popupOpen} onClose={() => setPopupOpen(false)} />
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>

        {/* Section label + heading */}
        <Typography sx={{ ...TEXT_STYLES.muted, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
          Pricing
        </Typography>
        <Typography sx={{ ...TEXT_STYLES.h1, mb: 2, maxWidth: 560 }}>
          {/* TODO: Replace with final pricing headline */}
          Simple, transparent pricing.
        </Typography>
        <Typography sx={{ ...TEXT_STYLES.body, mb: { xs: 8, md: 12 }, maxWidth: 480 }}>
          {/* TODO: Replace with supporting copy */}
          Start free, upgrade when you're ready.
        </Typography>

        {/* Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(3, 1fr)' },
            gap: { xs: 3, md: 4 },
            maxWidth: 960,
          }}
        >
          {pricingData.map((plan) => (
            <PricingCard key={plan.title} {...plan} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default Pricing;
