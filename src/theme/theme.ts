import { createTheme, responsiveFontSizes } from '@mui/material/styles'

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#65a30d',
      light: '#84cc16',
      dark: '#4d7c0f',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#fff',
    },
  },
  direction: 'rtl',
  typography: {
    allVariants: {
      textAlign: 'left',
    },
  },
  spacing: (factor: number) => `${0.25 * factor}rem`, // 4px base unit following Material Design guidelines
  components: {
    // Google Material Design margin implementation for containers only
    MuiContainer: {
      styleOverrides: {
        root: {
          // Extra-small (phone): 16dp margin
          margin: '16px',
          // Small (tablet): 32dp margin  
          '@media (min-width:600px)': {
            margin: '32px',
          },
          // Medium+ (laptop/desktop): Scaling margins up to 200dp max
          '@media (min-width:905px)': {
            marginLeft: 'clamp(32px, 8vw, 200px)',
            marginRight: 'clamp(32px, 8vw, 200px)',
            marginTop: '32px',
            marginBottom: '32px',
          },
          // Large (desktop): Fixed 200dp margin
          '@media (min-width:1440px)': {
            marginLeft: '200px',
            marginRight: '200px',
            marginTop: '32px',
            marginBottom: '32px',
          },
        },
      },
    },
  },
})

// Apply responsive font sizes
const theme = responsiveFontSizes(baseTheme)

export default theme 