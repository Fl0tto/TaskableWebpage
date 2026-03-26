import { Button as MuiButton } from '@mui/material';
import type {SxProps, Theme} from '@mui/material';
import { COLORS } from '../../colors';

interface CustomButtonProps {
  buttonType: 'Highlight' | 'Active' | 'Disabled';
  text: string;
  onClick?: () => void;
  sx?: SxProps<Theme>; // Optional overrides layout per-screen
}

const Button = ({ buttonType, text, onClick, sx }: CustomButtonProps) => {
  const getStyles = (): SxProps<Theme> => {
    const baseStyles: SxProps<Theme> = {
      borderRadius: '50px',
      textTransform: 'none',
      fontWeight: 600,
      padding: '12px 32px',
      transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)', // Approximates power2.out nicely
      border: '1px solid transparent',
      letterSpacing: '0.02em',
    };

    switch (buttonType) {
      case 'Highlight':
        return {
          ...baseStyles,
          backgroundColor: COLORS.mainAccent, // Using the primary gold thematic color
          color: COLORS.mainBg, // Dark contrasting text
          '&:hover': {
            backgroundColor: COLORS.secAccent,
          }
        };
      case 'Active':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.166)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(91, 191, 181, 0.2)',
          color: COLORS.offWhite, // Off-white theme color
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(91, 191, 181, 0.4)',
          }
        };
      case 'Disabled':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
        };
      default:
        return baseStyles;
    }
  };

  const sxProps = sx ? (Array.isArray(sx) ? sx : [sx]) : [];

  return (
    <MuiButton disableRipple onClick={onClick} sx={[getStyles(), ...sxProps]}>
      {text}
    </MuiButton>
  );
};

export default Button;