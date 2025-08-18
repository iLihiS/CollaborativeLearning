import { Box, Typography } from "@mui/material";

export const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 0.25,
        px: 2,
        backgroundColor: 'grey.100',
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
        width: '100%',
        minHeight: 'auto'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
        © {new Date().getFullYear()} מערכת זו נבנתה על ידי <Box component="span" sx={{ fontWeight: 'bold' }}>ליהי סער</Box>
      </Typography>
    </Box>
  );
}; 