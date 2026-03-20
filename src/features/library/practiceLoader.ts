import type { Practice } from './practiceTypes'

const practiceModules = import.meta.glob<Practice>(
  '/data/practices/*/practice.json',
  { eager: true, import: 'default' },
)

export function loadPractices(): Practice[] {
  return Object.values(practiceModules)
}

export function loadPracticeById(id: string): Practice | undefined {
  return loadPractices().find((p) => p.id === id)
}
