export const theme = {
  colors: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#8E8E93',
    border: '#E5E5EA',
    blue: '#007AFF',
    green: '#34C759',
    red: '#FF3B30',
    orange: '#FF9500',
  },
  typography: {
    // Use the iOS San Francisco defaults via system fonts
    titleLarge: { fontSize: 22, fontWeight: '700' as const },
    title: { fontSize: 18, fontWeight: '700' as const },
    subtitle: { fontSize: 14, fontWeight: '500' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '400' as const },
  },
  spacing: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    sm: 10,
    md: 12,
    lg: 20,
    xl: 28,
    card: 24, // large rounded corners for cards
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    } as const,
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    } as const,
  },
} as const;

export type Theme = typeof theme;

