const MODEL_VERSION = 'a9f33da7d9a985064dbc2d99621b87da5b8a22ed4d412c3a1c34ab4b807a6d8f'

interface GenerateAvatarOptions {
  prompt: string
  inputImage?: string // base64 data URL or URL
  style?: 'four_angle_walking' | 'walking_and_idle' | 'small_sprites'
}

export async function generateAvatar(options: GenerateAvatarOptions): Promise<string> {
  const { prompt, inputImage, style = 'four_angle_walking' } = options

  // Start prediction
  const input: Record<string, unknown> = {
    prompt: `pixel art character, ${prompt}`,
    style,
    width: 48,
    height: 48,
    return_spritesheet: false,
  }

  if (inputImage) {
    input.input_image = inputImage
  }

  const createRes = await fetch('/api/replicate/v1/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: MODEL_VERSION, input }),
  })

  if (!createRes.ok) {
    throw new Error(`Replicate API error: ${createRes.status}`)
  }

  const prediction = await createRes.json()
  let result = prediction

  // Poll until complete
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(r => setTimeout(r, 1500))
    const pollRes = await fetch(`/api/replicate/v1/predictions/${result.id}`)
    result = await pollRes.json()
  }

  if (result.status === 'failed') {
    throw new Error(result.error || 'Avatar generation failed')
  }

  // Output is array of URLs
  return result.output[0]
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
