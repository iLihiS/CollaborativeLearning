import * as React from 'react'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const MOBILE_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1024 // Desktop breakpoint for admin screens

export function useIsMobile(): boolean {
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  
  return isMobile
}

/**
 * Hook to check if the screen is desktop size (suitable for admin interfaces)
 * Uses Material-UI's useMediaQuery for better integration
 */
export function useIsDesktop(): boolean {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg')) // lg breakpoint = 1200px
  
  return isDesktop
}

/**
 * Hook specifically for admin screens that should only be accessible on desktop
 * Returns true if screen is large enough for admin interfaces
 */
export function useAdminScreenAccess(): boolean {
  const isAdminSize = useMediaQuery(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
  
  return isAdminSize
} 