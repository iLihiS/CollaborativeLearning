import { Box, Typography } from "@mui/material";

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 0.25,
        px: 2,
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid',
        borderColor: 'var(--border-color)',
        textAlign: 'center',
        width: '100%',
        minHeight: 'auto'
      }}
    >
      <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.2, color: 'var(--text-secondary)' }}>
        © {new Date().getFullYear()} מערכת זו נבנתה על ידי <Box component="span" sx={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>ליהי סער</Box>
      </Typography>
    </Box>
  );
}; 