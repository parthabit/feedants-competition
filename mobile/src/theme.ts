/** Design tokens sampled from the provided Feedants design. */
export const colors = {
  primary: '#0A7570',
  primaryDark: '#075E5A',
  primaryTint: '#E3F1F0', // banners, badges
  primaryTintBorder: '#BEDEDB',
  surface: '#FFFFFF',
  background: '#F6F9F9',
  border: '#E6ECEC',
  rowTint: '#F3F8F8',
  text: '#101F1F',
  textMuted: '#6B7877',
  textSoft: '#8A9695',
  success: '#0A7570',
  warning: '#B26A00',
  warningTint: '#FFF3DC',
  danger: '#B42318',
  dangerTint: '#FDE8E6',
  referralTint: '#E2F5E9',
  gold: '#E6A100',
  silver: '#9AA5A5',
  bronze: '#E8731A',
  disabled: '#9FBDBB',
  razorpay: '#1B3FA0',
};

export const radius = { card: 14, chip: 8, pill: 999, button: 10 };

export const spacing = { screen: 14, gap: 10, card: 14 };

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const cardShadow = {
  shadowColor: '#0B3B38',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
