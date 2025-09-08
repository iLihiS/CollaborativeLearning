import { createTheme } from '@mui/material/styles'

const theme = createTheme({
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
      textAlign: 'right',
    },
  },
})

export default theme 