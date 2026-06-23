import { createTheme, ThemeProvider } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark' | 'professional' | 'modern';

const createAppTheme = (themeMode: ThemeMode) => {
  const paletteByMode = {
    light: {
      mode: 'light',
      primary: { main: '#2563EB', dark: '#1D4ED8', light: '#93C5FD', contrastText: '#FFFFFF' },
      secondary: { main: '#7C3AED', dark: '#5B21B6', light: '#DDD6FE', contrastText: '#FFFFFF' },
      success: { main: '#22C55E', light: '#DCFCE7', contrastText: '#0F172A' },
      warning: { main: '#F59E0B', light: '#FEF3C7', contrastText: '#0F172A' },
      error: { main: '#EF4444', light: '#FECACA', contrastText: '#FFFFFF' },
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#475569' },
      divider: '#E2E8F0',
    },
    dark: {
      mode: 'dark',
      primary: { main: '#60A5FA', dark: '#2563EB', light: '#93C5FD', contrastText: '#0F172A' },
      secondary: { main: '#7C3AED', dark: '#6026C5', light: '#C4B5FD', contrastText: '#FFFFFF' },
      success: { main: '#22C55E', light: '#DCFCE7', contrastText: '#0F172A' },
      warning: { main: '#F59E0B', light: '#FDE68A', contrastText: '#0F172A' },
      error: { main: '#FB7185', light: '#FECACA', contrastText: '#0F172A' },
      background: { default: '#0F172A', paper: '#111827' },
      text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
      divider: '#1E293B',
    },
    professional: {
      mode: 'light',
      primary: { main: '#2563EB', dark: '#1D4ED8', light: '#93C5FD', contrastText: '#FFFFFF' },
      secondary: { main: '#7C3AED', dark: '#5B21B6', light: '#DDD6FE', contrastText: '#FFFFFF' },
      success: { main: '#22C55E', light: '#DCFCE7', contrastText: '#0F172A' },
      warning: { main: '#F59E0B', light: '#FEF3C7', contrastText: '#0F172A' },
      error: { main: '#EF4444', light: '#FECACA', contrastText: '#FFFFFF' },
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#475569' },
      divider: '#E2E8F0',
    },
    modern: {
      mode: 'light',
      primary: { main: '#2563EB', dark: '#1D4ED8', light: '#93C5FD', contrastText: '#FFFFFF' },
      secondary: { main: '#7C3AED', dark: '#5B21B6', light: '#DDD6FE', contrastText: '#FFFFFF' },
      success: { main: '#22C55E', light: '#DCFCE7', contrastText: '#0F172A' },
      warning: { main: '#F59E0B', light: '#FEF3C7', contrastText: '#0F172A' },
      error: { main: '#EF4444', light: '#FECACA', contrastText: '#FFFFFF' },
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#475569' },
      divider: '#E2E8F0',
    },
  } as const;

  const palette = paletteByMode[themeMode];

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
      h1: { fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em' },
      h2: { fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.1 },
      h3: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.15 },
      h4: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 },
      h5: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.35 },
      h6: { fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.45 },
      body1: { fontSize: '1rem', lineHeight: 1.7 },
      body2: { fontSize: '0.95rem', lineHeight: 1.65 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    shape: { borderRadius: 20 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            minHeight: '100vh',
            fontSmooth: 'always',
          },
          '#root': {
            minHeight: '100vh',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.84)',
            backdropFilter: 'blur(18px)',
            borderBottom: `1px solid ${palette.divider}`,
            boxShadow: 'none',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: 72,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: palette.mode === 'dark'
              ? '0 24px 80px rgba(15, 23, 42, 0.42)'
              : '0 18px 70px rgba(15, 23, 42, 0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(17,24,39,0.94))'
              : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
            border: `1px solid ${palette.mode === 'dark' ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.16)'}`,
            borderRadius: 24,
            boxShadow: palette.mode === 'dark'
              ? '0 30px 90px rgba(15, 23, 42, 0.38)'
              : '0 24px 70px rgba(15, 23, 42, 0.08)',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 999,
            padding: '12px 24px',
            boxShadow: 'none',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(135deg, #1D4ED8 0%, #6D28D9 100%)',
              boxShadow: '0 16px 30px rgba(37, 99, 235, 0.24)',
              transform: 'translateY(-1px)',
            },
          },
          containedSecondary: {
            background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 100%)',
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            borderWidth: 1,
            borderColor: palette.divider,
            color: palette.text.primary,
            backgroundColor: palette.mode === 'dark' ? '#0F172A' : '#FFFFFF',
            '&:hover': {
              borderColor: palette.primary.main,
              backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(37,99,235,0.08)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 16,
              backgroundColor: palette.mode === 'dark' ? '#111827' : '#FFFFFF',
              '& fieldset': {
                borderColor: palette.divider,
              },
              '&:hover fieldset': {
                borderColor: palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: palette.primary.main,
                borderWidth: 1.5,
              },
            },
            '& .MuiInputLabel-root': {
              color: palette.text.secondary,
            },
            '& .MuiInputBase-input::placeholder': {
              color: palette.text.secondary,
              opacity: 1,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          outlined: {
            backgroundColor: palette.mode === 'dark' ? '#111827' : '#FFFFFF',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 700,
            backgroundColor: palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.08)' : 'rgba(37, 99, 235, 0.08)',
          },
          outlined: {
            borderColor: palette.divider,
            backgroundColor: palette.mode === 'dark' ? '#111827' : '#F8FAFC',
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
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: palette.divider,
          },
          head: {
            color: palette.text.primary,
            backgroundColor: palette.mode === 'dark' ? '#111827' : '#F1F5F9',
          },
        },
      },
    },
  });
};

export const getTheme = createAppTheme;
export const theme = createAppTheme('professional');
export { ThemeProvider };
