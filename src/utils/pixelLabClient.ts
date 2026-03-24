const API_BASE = 'https://api.pixellab.ai/v2'

let apiKey = localStorage.getItem('knowledgeLeagueKids:pixelLabApiKey') || ''

export function setPixelLabApiKey(key: string): void {
  apiKey = key
  localStorage.setItem('knowledgeLeagueKids:pixelLabApiKey', key)
}

export function getPixelLabApiKey(): string {
  return apiKey
}

export function hasPixelLabApiKey(): boolean {
  return apiKey.length > 0
}

async function apiPost(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PixelLab API ${res.status}: ${text}`)
  }
  return res.json()
}

async function apiGet(endpoint: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PixelLab API ${res.status}: ${text}`)
  }
  return res.json()
}

async function pollJob(jobId: string, onProgress?: (status: string) => void): Promise<Record<string, unknown>> {
  const maxAttempts = 60
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const result = await apiGet(`/background-jobs/${jobId}`)
    const status = result.status as string
    if (onProgress) onProgress(status)
    if (status === 'completed') return result
    if (status === 'failed') throw new Error(`Job failed: ${JSON.stringify(result)}`)
  }
  throw new Error('Job timed out after 2 minutes')
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export interface GenerationProgress {
  step: string
  detail: string
}

export async function generatePixelCharacter(
  description: string,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<{
  idle: string
  runFrames: string[]
  south: string
}> {
  onProgress?.({ step: 'creating', detail: 'Creating character...' })

  // Step 1: Create character with 4 directions
  const createResult = await apiPost('/create-character-with-4-directions', {
    description: `${description}, pixel art game character, 16-bit retro style`,
    image_size: { width: 32, height: 32 },
    outline: 'thin',
    shading: 'soft',
    detail: 'medium',
    view: 'side',
  })

  const characterId = createResult.character_id as string
  const bgJobId = createResult.background_job_id as string

  onProgress?.({ step: 'waiting', detail: 'Generating sprites...' })

  // Poll character creation job
  await pollJob(bgJobId, (status) => {
    onProgress?.({ step: 'waiting', detail: `Generating sprites (${status})...` })
  })

  // Get the character data with rotation URLs
  onProgress?.({ step: 'downloading', detail: 'Downloading character sprites...' })
  const charData = await apiGet(`/characters/${characterId}`)
  const rotationUrls = charData.rotation_urls as Record<string, string>

  // Download the east-facing (idle) and south-facing sprites
  const idleUrl = rotationUrls?.east || rotationUrls?.right || Object.values(rotationUrls || {})[0]
  const southUrl = rotationUrls?.south || rotationUrls?.front || idleUrl

  const idle = idleUrl ? await urlToDataUrl(idleUrl) : ''
  const south = southUrl ? await urlToDataUrl(southUrl) : idle

  // Step 2: Generate run animation
  onProgress?.({ step: 'animating', detail: 'Creating run animation...' })

  const animResult = await apiPost('/characters/animations', {
    character_id: characterId,
    template_animation_id: 'running-4-frames',
    animation_name: 'run',
    directions: ['east'],
  })

  const animJobIds = animResult.background_job_ids as string[]
  if (!animJobIds || animJobIds.length === 0) {
    // No animation job — return idle only
    return { idle, runFrames: idle ? [idle] : [], south }
  }

  onProgress?.({ step: 'animating', detail: 'Generating run frames...' })
  const animJob = await pollJob(animJobIds[0], (status) => {
    onProgress?.({ step: 'animating', detail: `Generating run frames (${status})...` })
  })

  // Extract frames from job result
  const lastResponse = animJob.last_response as Record<string, unknown> | undefined
  const storageUrls = lastResponse?.storage_urls as Record<string, unknown> | undefined
  const frameUrls = (storageUrls?.frames as string[]) || []

  onProgress?.({ step: 'downloading', detail: `Downloading ${frameUrls.length} animation frames...` })

  const runFrames: string[] = []
  for (const frameUrl of frameUrls) {
    try {
      const dataUrl = await urlToDataUrl(frameUrl)
      runFrames.push(dataUrl)
    } catch {
      // Skip failed frames
    }
  }

  // If no frames downloaded, fall back to idle
  if (runFrames.length === 0 && idle) {
    runFrames.push(idle)
  }

  onProgress?.({ step: 'done', detail: 'Character ready!' })

  return { idle, runFrames, south }
}
