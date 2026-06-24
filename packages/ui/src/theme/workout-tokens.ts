/**
 * Workout-specific tokens not yet in the main Tailwind config.
 * Use these inline instead of Tailwind classes.
 */
export const WORKOUT_TOKENS = {
  // Velocity zones (not in Tailwind)
  velocity: {
    green: '#2ed573',
    yellow: '#ffd43b',
    orange: '#ffa502',
    red: '#ff4757',
  },

  // Badge border-radius (rounded-sm is 4px, we need 2px)
  badgeRadius: 2,

  // Border colors (use inline to avoid 'border' class pitfall)
  border: {
    default: '#1F1F1F',
    strong: '#2C2C2C',
    subtle: '#1C1C1C',
  },

  // Surface colors for inline use
  surface: {
    raised: '#1C1C1C',
    elevated: '#191919',
  },

  // Intensity bar specific
  intensity: {
    track: '#333333',
    over1: '#D14343',
    over2: '#A62626',
    over3: '#7A1C1C',
    targetLine: 'rgba(33, 150, 243, 0.5)',
    atTargetGlow:
      '0 0 5px 1px rgba(33, 150, 243, 0.35), 0 0 10px 3px rgba(33, 150, 243, 0.15)',
  },

  // Placeholder strip
  placeholder: {
    fill: '#3A3A3A',
  },

  // Deviation bar
  deviation: {
    track: '#333333',
  },
} as const
