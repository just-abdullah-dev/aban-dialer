/**
 * Glassmorphism Design System
 *
 * Beautiful glass-effect design with backdrop blur, transparency,
 * and subtle gradients. Professional dialer interface.
 */

export const theme = {
  // Glassmorphic color palette
  colors: {
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      glass: 'rgba(99, 102, 241, 0.1)',
    },
    secondary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#7c3aed',
      glass: 'rgba(139, 92, 246, 0.1)',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      glass: 'rgba(16, 185, 129, 0.1)',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      glass: 'rgba(245, 158, 11, 0.1)',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      glass: 'rgba(239, 68, 68, 0.1)',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.1)',
      bgDark: 'rgba(0, 0, 0, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      borderDark: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      light: '#9ca3af',
      white: '#ffffff',
    },
  },

  // Glassmorphic effects
  glass: {
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
    },
    cardHover: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
    },
    modal: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.5rem',  // 8px
    sm: '1rem',    // 16px
    md: '1.5rem',  // 24px
    lg: '2rem',    // 32px
    xl: '3rem',    // 48px
    '2xl': '4rem', // 64px
  },

  // Border radius
  radius: {
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    full: '9999px',
  },

  // Typography
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Shadows
  shadows: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.05)',
    md: '0 4px 16px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.15)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  },

  // Animations
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
};

// CSS-in-JS helper for glassmorphism
export const glassStyles = {
  card: `
    background: ${theme.glass.card.background};
    backdrop-filter: ${theme.glass.card.backdropFilter};
    -webkit-backdrop-filter: ${theme.glass.card.backdropFilter};
    border: ${theme.glass.card.border};
    box-shadow: ${theme.glass.card.boxShadow};
    border-radius: ${theme.radius.lg};
  `,
  header: `
    background: ${theme.glass.header.background};
    backdrop-filter: ${theme.glass.header.backdropFilter};
    -webkit-backdrop-filter: ${theme.glass.header.backdropFilter};
    border-bottom: ${theme.glass.header.border};
  `,
  modal: `
    background: ${theme.glass.modal.background};
    backdrop-filter: ${theme.glass.modal.backdropFilter};
    -webkit-backdrop-filter: ${theme.glass.modal.backdropFilter};
    border: ${theme.glass.modal.border};
    box-shadow: ${theme.glass.modal.boxShadow};
    border-radius: ${theme.radius.xl};
  `,
};
