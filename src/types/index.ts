export interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  current_role: string;
  theme_preference: string;
}

export interface ToastState {
  open: boolean;
  message: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType;
  badge?: number;
} 