// lib/units.ts — unit conversion helpers
export function kgToDisplay(kg: number, pref: string): string {
  if (pref === 'metric') return `${Math.round(kg * 10) / 10} kg`
  return `${Math.round(kg * 2.20462 * 10) / 10} lbs`
}

export function kgToNum(kg: number, pref: string): number {
  if (pref === 'metric') return Math.round(kg * 10) / 10
  return Math.round(kg * 2.20462 * 10) / 10
}

export function displayToKg(val: number, pref: string): number {
  if (pref === 'metric') return val
  return val * 0.453592
}

export function weightUnit(pref: string): string {
  return pref === 'metric' ? 'kg' : 'lbs'
}

export function heightDisplay(cm: number, pref: string): string {
  if (pref === 'metric') return `${Math.round(cm)} cm`
  const totalIn = cm / 2.54
  const ft = Math.floor(totalIn / 12)
  const inches = Math.round(totalIn % 12)
  return inches === 12 ? `${ft + 1}'0"` : `${ft}'${inches}"`
}
