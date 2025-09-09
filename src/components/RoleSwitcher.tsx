import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Users, 
  GraduationCap, 
  Shield, 
  ChevronDown, 
  User as UserIcon,
  RefreshCw 
} from 'lucide-react';
import { UserRole, UserSession } from '@/types';
import { UserService } from '@/services/userService';

interface RoleSwitcherProps {
  session: UserSession;
  onRoleChange: (newRole: UserRole) => void;
}

const roleConfig = {
  student: {
    label: 'סטודנט',
    icon: Users,
    color: '#2e7d32',
    bgColor: '#e8f5e8'
  },
  lecturer: {
    label: 'מרצה',
    icon: GraduationCap,
    color: '#2e7d32',
    bgColor: '#e8f5e8'
  },
  admin: {
    label: 'מנהל',
    icon: Shield,
    color: '#2e7d32',
    bgColor: '#e8f5e8'
  }
};

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ session, onRoleChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (role !== session.current_role) {
      console.log(`🔄 RoleSwitcher: Switching to role ${role}`);
      onRoleChange(role);
    }
    handleClose();
  };

  const currentRoleConfig = roleConfig[session.current_role];
  const CurrentRoleIcon = currentRoleConfig.icon;

  // If user has only one role, show as button with same styling
  if (session.available_roles.length <= 1) {
    return (
      <Button
        variant="contained"
        color="inherit"
        size="small"
        startIcon={<CurrentRoleIcon size={16} />}
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          '& .MuiButton-startIcon': {
            color: 'white',
            mr: { xs: 0, sm: 1 }
          },
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)',
            color: '#2e7d32',
            '& .MuiButton-startIcon': {
              color: '#2e7d32'
            }
          },
          textTransform: 'none',
          fontWeight: 500,
          px: { xs: 1, sm: 2 }, // Narrower on mobile
          minWidth: { xs: 'auto', sm: 'auto' }, // Auto minimum width
          cursor: 'default', 
          '& .button-text': {
            display: { xs: 'none', sm: 'inline' }
          }
        }}
      >
        <Box component="span" className="button-text">
          {currentRoleConfig.label}
        </Box>
      </Button>
    );
  }

  return (
    <Box>
      <Button
        onClick={handleClick}
        variant="contained"
        color="inherit"
        size="small"
        startIcon={<CurrentRoleIcon size={16} />}
        endIcon={<ChevronDown size={14} />}
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            color: 'white'
          },
          '&:hover': {
            bgcolor: 'rgba(255,255,255,0.9)',
            color: '#2e7d32',
            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
              color: '#2e7d32'
            }
          },
          textTransform: 'none',
          fontWeight: 500,
          px: { xs: 1, sm: 2 }, // Narrower on mobile
          minWidth: { xs: 'auto', sm: 'auto' }, // Auto minimum width
          '& .MuiButton-startIcon': {
            mr: { xs: 0, sm: 1 }
          },
          '& .MuiButton-endIcon': {
            ml: { xs: 0, sm: 0.5 } // Smaller margin on mobile
          },
          '& .button-text': {
            display: { xs: 'none', sm: 'inline' }
            }
        }}
      >
        <Box component="span" className="button-text">
          {currentRoleConfig.label}
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e0e0e0'
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" color="text.secondary" textAlign="left" fontWeight="bold" sx={{ mb: 0.5 }}>
            משתמש נוכחי
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
              <UserIcon size={14} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500} textAlign="left">
                {session.user.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" textAlign="left">
                ת.ז: {session.user.national_id}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 1 }}>
          <Typography variant="caption" color="text.secondary" textAlign="left" sx={{ px: 2, py: 1, display: 'block' }}>
            בחר תפקיד:
          </Typography>
          
          {session.available_roles.map((role) => {
            const config = roleConfig[role];
            const RoleIcon = config.icon;
            const isActive = role === session.current_role;
            
            return (
              <MenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                disabled={isActive}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: isActive ? config.bgColor : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? config.bgColor : `${config.bgColor}80`
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <RoleIcon size={18} style={{ color: config.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={config.label}
                  secondary={getRoleDescription(role, session.user)}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? config.color : 'text.primary',
                    textAlign: 'left'
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary',
                    textAlign: 'left'
                  }}
                />
                {isActive && (
                  <Chip
                    label="פעיל"
                    size="small"
                    sx={{
                      bgcolor: config.color,
                      color: 'white',
                      height: 20,
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </MenuItem>
            );
          })}
        </Box>

        <Divider />
        
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RefreshCw size={12} />
            החלף תפקיד בכל עת
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

function getRoleDescription(role: UserRole, user: any): string {
  switch (role) {
    case 'student':
      return `מספר סטודנט: ${user.student_id || 'לא הוגדר'}`;
    case 'lecturer':
      return `מספר עובד: ${user.employee_id || 'לא הוגדר'}`;
    case 'admin':
      return `מספר מנהל: ${user.admin_id || 'לא הוגדר'}`;
    default:
      return '';
  }
} 