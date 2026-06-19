import { createTheme, ThemeProvider } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563EB',
      dark: '#1E3A8A',
      light: '#DBEAFE',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0F766E',
      dark: '#115E59',
      light: '#CCFBF1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F6F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#172033',
      secondary: '#5B677A',
    },
    success: {
      main: '#16803C',
      light: '#DCFCE7',
    },
    warning: {
      main: '#B7791F',
      light: '#FEF3C7',
    },
    error: {
      main: '#C2410C',
      light: '#FFEDD5',
    },
    divider: '#E4E9F2',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '3.25rem',
      fontWeight: 750,
      lineHeight: 1.12,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0,
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.32,
      letterSpacing: 0,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 650,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 650,
      letterSpacing: 0,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 650,
      letterSpacing: 0,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.55,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F7FAFC',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          padding: '10px 22px',
          boxShadow: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2563EB 0%, #0F766E 100%)',
          boxShadow: '0 12px 24px rgba(37, 99, 235, 0.22)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1D4ED8 0%, #0E6F68 100%)',
            boxShadow: '0 16px 30px rgba(37, 99, 235, 0.26)',
          },
        },
        outlined: {
          borderColor: '#CBD5E1',
          color: '#1E3A8A',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderColor: '#1D4ED8',
            backgroundColor: '#EFF6FF',
          },
        },
        text: {
          color: '#334155',
          '&:hover': {
            backgroundColor: '#EFF6FF',
            color: '#1D4ED8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4E9F2',
          borderRadius: 8,
          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          '&:hover': {
            borderColor: '#C8D4E7',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          color: '#172033',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#172033',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#D9E2EF',
            },
            '&:hover fieldset': {
              borderColor: '#A8B6CC',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#667085',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#2563EB',
          },
          '& .MuiInputBase-input::placeholder': {
            color: '#8A97AA',
            opacity: 1,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
        outlined: {
          borderColor: '#D9E2EF',
          color: '#344054',
          backgroundColor: '#F8FAFC',
          '&:hover': {
            backgroundColor: '#EFF6FF',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E4E9F2',
          color: '#172033',
          boxShadow: '0 1px 0 rgba(15, 23, 42, 0.02)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#E4E9F2',
        },
        head: {
          color: '#172033',
          backgroundColor: '#F1F5F9',
        },
      },
    },
  },
});

export { ThemeProvider };
