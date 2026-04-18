/**
 * SmartSchool SN — Centralized Framer Motion Variants
 * Used across all pages for consistent animations
 */

// Fade in from bottom (default page element reveal)
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// Fade in from right
export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// Simple fade
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

// Scale in (modals, cards)
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

// Container for staggering children
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

// Slower stagger for hero sections
export const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Card hover animation props (use with motion.div whileHover)
export const cardHover = {
  y: -4,
  transition: { duration: 0.2, ease: 'easeOut' },
}

// Tap animation
export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
}

// Viewport detection settings for scroll reveals
export const viewportOnce = {
  once: true,
  margin: '-50px',
  amount: 0.15,
}
