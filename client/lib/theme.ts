export const THEME_COLORS = {
  // Primary brand colors matching noon.com yellow
  primary: {
    50: '#fffdf0',
    100: '#fffbe6',
    200: '#fff6cc',
    300: '#ffed99',
    400: '#ffe066',
    500: '#f8d247', // Main noon.com yellow
    600: '#e6be00',
    700: '#cc9900',
    800: '#b37700',
    900: '#996600',
  },
  
  // Secondary colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Service specific colors
  services: {
    grocery: {
      primary: '#10b981', // green-500
      secondary: '#d1fae5',
      accent: '#047857'
    },
    trips: {
      primary: '#3b82f6', // blue-500
      secondary: '#dbeafe',
      accent: '#1d4ed8'
    },
    carRental: {
      primary: '#8b5cf6', // purple-500
      secondary: '#e9d5ff',
      accent: '#7c3aed'
    },
    handyman: {
      primary: '#f97316', // orange-500
      secondary: '#fed7aa',
      accent: '#ea580c'
    }
  },
  
  // Status colors
  status: {
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6'
  }
};

export const THEME_TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Inter', 'system-ui', 'sans-serif']
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  }
};

export const THEME_SPACING = {
  section: 'py-16 lg:py-24',
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  card: 'p-6 lg:p-8',
  button: 'px-6 py-3'
};

export const THEME_SHADOWS = {
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  buttonHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};
