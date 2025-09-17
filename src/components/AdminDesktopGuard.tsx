import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { Monitor, Smartphone } from 'lucide-react'
import { useAdminScreenAccess } from '@/hooks/use-mobile'

interface AdminDesktopGuardProps {
  children: React.ReactNode
  pageName?: string
}

/**
 * Component that ensures admin screens are only accessible on desktop devices
 * Shows a friendly message on mobile/tablet devices
 */
export const AdminDesktopGuard: React.FC<AdminDesktopGuardProps> = ({ 
  children, 
  pageName = "ניהול מערכת" 
}) => {
  const hasDesktopAccess = useAdminScreenAccess()

  if (!hasDesktopAccess) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          p: 3,
          textAlign: 'center'
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 500,
            bgcolor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Smartphone 
              size={48} 
              color="#94a3b8" 
              style={{ opacity: 0.7 }} 
            />
            <Typography variant="h4" sx={{ mx: 1, color: 'var(--text-secondary)' }}>
              ←
            </Typography>
            <Monitor 
              size={48} 
              color="#65a30d" 
            />
          </Box>
          
          <Typography 
            variant="h5" 
            gutterBottom 
            textAlign="center"
            sx={{ 
              fontWeight: 600,
              color: 'var(--text-primary)',
              mb: 2
            }}
          >
            נדרש מסך גדול יותר לתצוגת ניהול
          </Typography>
          
          <Typography 
            variant="body1" 
            textAlign="left"
            sx={{ 
              color: 'var(--text-secondary)',
              mb: 3,
              lineHeight: 1.6
            }}
          >
            מסך {pageName} מיועד לשימוש במחשבים שולחניים ומחשבים נישאים בלבד.
            <br />
            אנא פתח את המערכת ממסך גדול יותר כדי לגשת לתכונות הניהול.
          </Typography>
          
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(101, 163, 13, 0.1)', 
            borderRadius: 1,
            border: '1px solid rgba(101, 163, 13, 0.2)'
          }}>
            <Typography 
            variant="body2" 
            textAlign="left"
              sx={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
              }}
            >
              <strong>דרישות מינימום:</strong> רזולוציה של 1024px רוחב או יותר
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            sx={{ 
              mt: 3,
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              '&:hover': {
                borderColor: '#65a30d',
                bgcolor: 'rgba(101, 163, 13, 0.05)'
              }
            }}
          >
            חזרה אחורה
          </Button>
        </Paper>
      </Box>
    )
  }

  return <>{children}</>
}

export default AdminDesktopGuard
