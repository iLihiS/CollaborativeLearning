import { Link } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge
} from '@mui/material'
import {
  Menu,
  GraduationCap,
  Bell,
  MessageSquare,
  HelpCircle
} from 'lucide-react'

import { createPageUrl } from '@/utils'
import { RoleSwitcher } from '@/components/RoleSwitcher'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  onMenuToggle: () => void
  unreadNotifications: number
  unhandledInquiries: number
}

export const Header = ({ 
  onMenuToggle, 
  unreadNotifications, 
  unhandledInquiries 
}: HeaderProps) => {
  const { session, switchRole } = useAuth()
  
  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(to right, #84cc16, #65a30d)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: '44px', md: '48px' }, py: 0, position: 'relative', px: { xs: 1, md: 2 } }}>
        {/* Left side - Menu and Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: { xs: 1, md: 2 } }}
          >
            <Menu />
          </IconButton>
          
          <Box 
            component={Link}
            to={createPageUrl('Dashboard')}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 1.5 },
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            <Box 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <GraduationCap style={{ width: 18, height: 18, color: 'white' }} />
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 0.2, sm: 1.5 }
            }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  fontSize: { xs: '0.75rem', sm: '0.9rem', lg: '1.1rem' }
                }}
              >
                למידה שיתופית
              </Typography>
              
              <Typography 
                variant="body1"
                sx={{ 
                  color: 'white',
                  fontWeight: 300,
                  opacity: 0.9,
                  lineHeight: 1,
                  fontSize: { xs: '0.65rem', sm: '0.8rem', lg: '1rem' }
                }}
              >
                בקריה האקדמית אונו
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Center - Quote - Absolutely positioned for true center */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'none', lg: 'block' }
          }}
        >
          <Typography 
            variant="body2"
            sx={{ 
              color: 'white',
              fontStyle: 'italic',
              opacity: 0.8,
              fontSize: '0.85rem',
              direction: 'ltr'
            }}
          >
            " When you share successes, you succeed more "
          </Typography>
        </Box>

        {/* Right side - Role Switcher and Action buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, ml: 'auto' }}>
          {session && (
            <Box sx={{ mr: { xs: 0.5, md: 1 } }}>
              <RoleSwitcher 
                session={session} 
                onRoleChange={switchRole}
              />
            </Box>
          )}
          
          <IconButton
            component={Link}
            to={createPageUrl('Notifications')}
            sx={{ 
              color: 'white',
              position: 'relative',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <Bell style={{ width: 18, height: 18 }} />
            </Badge>
          </IconButton>
          
          <IconButton
            component={Link}
            to={createPageUrl('TrackInquiries')}
            sx={{ 
              color: 'white',
              position: 'relative',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Badge badgeContent={unhandledInquiries} color="warning">
              <MessageSquare style={{ width: 18, height: 18 }} />
            </Badge>
          </IconButton>
          
          <IconButton
            component={Link}
            to={createPageUrl('Help')}
            sx={{ 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <HelpCircle style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
} 