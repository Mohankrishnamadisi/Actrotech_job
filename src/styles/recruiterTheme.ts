import { createTheme } from '@mui/material/styles';

const colors = {
  primary: '#5B8CFF',
  primaryDark: '#3C63E6',
  primaryLight: '#DDEBFF',
  secondary: '#8B5CF6',
  secondarySoft: '#F0E8FF',
  accent: '#22C55E',
  success: '#10B981',
  danger: '#F56565',
  warning: '#F59E0B',
  info: '#06B6D4',
  midnight: '#091324',
  midnightAlt: '#0E1B34',
  slate: '#101A2D',
  background: '#F6F8FF',
  backgroundAlt: '#EEF3FF',
  surface: '#FFFFFF',
  border: '#DDE6F7',
  borderDark: '#B8C5E2',
  text: {
    primary: '#111827',
    secondary: '#58657A',
    tertiary: '#7B8798',
  },
  hover: '#EDF3FF',
};

export const recruiterTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.primaryLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.secondary,
      contrastText: '#FFFFFF',
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.danger,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.backgroundAlt,
      paper: colors.background,
    },
    divider: colors.border,
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '2.1rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.45rem',
      fontWeight: 700,
      lineHeight: 1.35,
    },
    h4: {
      fontSize: '1.2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.05rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '0.96rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.96rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.82rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.8rem',
    },
    caption: {
      fontSize: '0.72rem',
      lineHeight: 1.5,
      color: colors.text.secondary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8rem',
          padding: '8px 14px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)',
          },
        },
        outlined: {
          borderColor: colors.border,
          '&:hover': {
            backgroundColor: colors.hover,
          },
        },
      },
      defaultProps: {
        variant: 'contained',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            borderColor: colors.borderDark,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: colors.border,
            },
            '&:hover fieldset': {
              borderColor: colors.borderDark,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          color: colors.text.secondary,
          minHeight: '48px',
          '&.Mui-selected': {
            color: colors.primary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: '50%',
          backgroundColor: colors.danger,
          color: '#FFFFFF',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const themeColors = colors;
