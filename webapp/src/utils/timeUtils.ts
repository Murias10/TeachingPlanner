const MIN_MINUTES = 9 * 60  // 09:00
const MAX_MINUTES = 21 * 60 // 21:00

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export const calculateDurationInMinutes = (startTime: string, endTime: string): number =>
  timeToMinutes(endTime) - timeToMinutes(startTime)

/**
 * Calcula el nuevo endTime al mover startTime, manteniendo la duración original.
 * Garantiza que endTime sea al menos 15 min después de newStartTime.
 */
export const calculateNewEndTime = (newStartTime: string, duration: number): string => {
  const newStartMin = timeToMinutes(newStartTime)
  const proposed = newStartMin + duration
  const clamped = Math.max(newStartMin + 15, Math.min(MAX_MINUTES, proposed))
  const rounded = Math.round(clamped / 15) * 15
  const final = Math.min(rounded, MAX_MINUTES)
  const h = Math.floor(final / 60)
  const m = final % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
