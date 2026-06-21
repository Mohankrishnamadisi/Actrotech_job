import { createTheme, ThemeProvider } from '@mui/material/styles';

const createAppTheme = (themeMode: 'light' | 'dark' | 'professional' | 'modern') => {
  const common = {
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
            backgroundColor: themeMode === 'dark' ? '#0F172A' : '#F7FAFC',
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
            background: themeMode === 'modern'
              ? 'linear-gradient(135deg, #4F46E5 0%, #22C55E 100%)'
              : 'linear-gradient(135deg, #2563EB 0%, #0F766E 100%)',
            boxShadow: '0 12px 24px rgba(37, 99, 235, 0.22)',
            '&:hover': {
              background: themeMode === 'modern'
                ? 'linear-gradient(135deg, #4338CA 0%, #16A34A 100%)'
                : 'linear-gradient(135deg, #1D4ED8 0%, #0E6F68 100%)',
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
            backgroundColor: themeMode === 'dark' ? '#0F172A' : '#FFFFFF',
            border: `1px solid ${themeMode === 'dark' ? '#1E293B' : '#E4E9F2'}`,
            borderRadius: 8,
            boxShadow: themeMode === 'dark' ? '0 18px 40px rgba(15, 23, 42, 0.35)' : '0 14px 34px rgba(15, 23, 42, 0.07)',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
            '&:hover': {
              borderColor: themeMode === 'dark' ? '#334155' : '#C8D4E7',
              boxShadow: themeMode === 'dark' ? '0 22px 52px rgba(15, 23, 42, 0.45)' : '0 18px 40px rgba(15, 23, 42, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: themeMode === 'dark' ? '#111827' : '#FFFFFF',
            color: themeMode === 'dark' ? '#F8FAFC' : '#172033',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              color: themeMode === 'dark' ? '#F8FAFC' : '#172033',
              borderRadius: 8,
              backgroundColor: themeMode === 'dark' ? '#111827' : '#FFFFFF',
              '& fieldset': {
                borderColor: themeMode === 'dark' ? '#334155' : '#D9E2EF',
              },
              '&:hover fieldset': {
                borderColor: themeMode === 'dark' ? '#60A5FA' : '#A8B6CC',
              },
              '&.Mui-focused fieldset': {
                borderColor: themeMode === 'dark' ? '#60A5FA' : '#2563EB',
                borderWidth: 1,
              },
            },
            '& .MuiInputLabel-root': {
              color: themeMode === 'dark' ? '#94A3B8' : '#667085',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: themeMode === 'dark' ? '#93C5FD' : '#2563EB',
            },
            '& .MuiInputBase-input::placeholder': {
              color: themeMode === 'dark' ? '#CBD5E1' : '#8A97AA',
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            backgroundColor: themeMode === 'dark' ? '#111827' : '#FFFFFF',
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
            borderColor: themeMode === 'dark' ? '#334155' : '#D9E2EF',
            color: themeMode === 'dark' ? '#E2E8F0' : '#344054',
            backgroundColor: themeMode === 'dark' ? '#0F172A' : '#F8FAFC',
            '&:hover': {
              backgroundColor: themeMode === 'dark' ? '#111827' : '#EFF6FF',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${themeMode === 'dark' ? '#1E293B' : '#E4E9F2'}`,
            color: themeMode === 'dark' ? '#F8FAFC' : '#172033',
            boxShadow: '0 1px 0 rgba(15, 23, 42, 0.02)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: themeMode === 'dark' ? '#1E293B' : '#E4E9F2',
          },
          head: {
            color: themeMode === 'dark' ? '#E2E8F0' : '#172033',
            backgroundColor: themeMode === 'dark' ? '#111827' : '#F1F5F9',
          },
        },
      },
    },
  };

  const paletteByMode = {
    light: {
      primary: { main: '#2563EB', dark: '#1E3A8A', light: '#DBEAFE', contrastText: '#FFFFFF' },
      secondary: { main: '#0F766E', dark: '#115E59', light: '#CCFBF1', contrastText: '#FFFFFF' },
      background: { default: '#F6F8FB', paper: '#FFFFFF' },
      text: { primary: '#172033', secondary: '#5B677A' },
      success: { main: '#16803C', light: '#DCFCE7' },
      warning: { main: '#B7791F', light: '#FEF3C7' },
      error: { main: '#C2410C', light: '#FFEDD5' },
      divider: '#E4E9F2',
    },
    dark: {
      primary: { main: '#60A5FA', dark: '#2563EB', light: '#93C5FD', contrastText: '#0F172A' },
      secondary: { main: '#34D399', dark: '#10B981', light: '#86EFAC', contrastText: '#0F172A' },
      background: { default: '#0F172A', paper: '#111827' },
      text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
      success: { main: '#22C55E', light: '#ECFDF5' },
      warning: { main: '#F59E0B', light: '#FDE68A' },
      error: { main: '#FB7185', light: '#FECACA' },
      divider: '#1E293B',
    },
    professional: {
      primary: { main: '#2563EB', dark: '#1E3A8A', light: '#DBEAFE', contrastText: '#FFFFFF' },
      secondary: { main: '#0F766E', dark: '#115E59', light: '#CCFBF1', contrastText: '#FFFFFF' },
      background: { default: '#F6F8FB', paper: '#FFFFFF' },
      text: { primary: '#172033', secondary: '#5B677A' },
      success: { main: '#16803C', light: '#DCFCE7' },
      warning: { main: '#B7791F', light: '#FEF3C7' },
      error: { main: '#C2410C', light: '#FFEDD5' },
      divider: '#E4E9F2',
    },
    modern: {
      primary: { main: '#4F46E5', dark: '#4338CA', light: '#C7D2FE', contrastText: '#FFFFFF' },
      secondary: { main: '#22C55E', dark: '#16A34A', light: '#DCFCE7', contrastText: '#0F172A' },
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#111827', secondary: '#475569' },
      success: { main: '#14B8A6', light: '#CCFBF1' },
      warning: { main: '#F97316', light: '#FED7AA' },
      error: { main: '#EF4444', light: '#FECACA' },
      divider: '#E2E8F0',
    },
  };

  return createTheme({
    palette: paletteByMode[themeMode],
    ...common,
  });
};

export const getTheme = createAppTheme;
export const theme = createAppTheme('professional');
export { ThemeProvider };
