import { Platform } from 'react-native';

export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F7',
  border: '#E9E9E9',
  text: '#111111',
  textMuted: '#6B7280',
  accent: '#111111',
  accentSoft: '#F1F1F1',
  success: '#2D6A4F',
  danger: '#B42318',
  tabInactive: '#767676',
  overlay: 'rgba(0, 0, 0, 0.36)'
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 24,
  pill: 999
} as const;

export const typography = {
  titleFamily: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-medium',
    default: 'System'
  }),
  bodyFamily: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif',
    default: 'System'
  })
} as const;
