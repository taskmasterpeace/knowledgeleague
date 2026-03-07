import { generateAvatar } from './replicate'
import { CPU_CHARACTERS } from './constants'

const STORAGE_KEY = 'mathMuscle:cpuAvatars'

const CPU_PROMPTS: Record<string, string> = {
  Kevin: 'A boy with red spiky hair, competitive, wearing a red jersey, pixel art character',
  Sally: 'A girl with purple braids, calm and focused, wearing a purple dress, pixel art character',
  Benny: 'A younger boy with messy green hair, friendly smile, wearing a green t-shirt, pixel art character',
  Mia: 'A girl with wild orange curly hair, mischievous grin, wearing an orange hoodie, pixel art character',
}

interface CachedAvatars {
  [name: string]: string // name → URL
}

export function getCachedCPUAvatars(): CachedAvatars {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return {}
}

export async function generateCPUAvatar(name: string): Promise<string> {
  const prompt = CPU_PROMPTS[name]
  if (!prompt) throw new Error(`No prompt for CPU character: ${name}`)

  const url = await generateAvatar({ prompt })

  const cached = getCachedCPUAvatars()
  cached[name] = url
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))

  return url
}

export async function generateAllCPUAvatars(
  onProgress?: (name: string, url: string) => void
): Promise<CachedAvatars> {
  const cached = getCachedCPUAvatars()
  const results = { ...cached }

  for (const cpu of CPU_CHARACTERS) {
    if (results[cpu.name]) continue
    try {
      const url = await generateCPUAvatar(cpu.name)
      results[cpu.name] = url
      onProgress?.(cpu.name, url)
    } catch (err) {
      console.error(`Failed to generate avatar for ${cpu.name}:`, err)
    }
  }

  return results
}
