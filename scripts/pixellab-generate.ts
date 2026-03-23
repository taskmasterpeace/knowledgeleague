import * as fs from "fs";
import * as path from "path";

// ── Types ──────────────────────────────────────────────────────────────────

interface PlanItem {
  id: string;
  type: string;
  depends_on?: string;
  params: Record<string, unknown>;
  output: string;
}

// PixelLab API returns flat JSON (no wrapper) — fields vary by endpoint
type ApiResponse = Record<string, unknown>;

interface ResultEntry {
  id: string;
  type: string;
  apiId: string | null;
  localPath: string;
  files: string[];
  timestamp: string;
}

// ── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = "https://api.pixellab.ai/v2";
const POLL_INTERVAL_MS = 15_000;
const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");

// ── Helpers ────────────────────────────────────────────────────────────────

function loadApiKey(): string {
  // Check environment first
  if (process.env.PIXELLAB_API_KEY && process.env.PIXELLAB_API_KEY !== "your_key_here") {
    return process.env.PIXELLAB_API_KEY;
  }
  // Parse .env file
  const envPath = path.join(PROJECT_ROOT, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("PIXELLAB_API_KEY=")) {
        const val = trimmed.slice("PIXELLAB_API_KEY=".length).trim();
        if (val && val !== "your_key_here") return val;
      }
    }
  }
  throw new Error("PIXELLAB_API_KEY not found. Set it in .env or as an environment variable.");
}

function parseArgs(): { phase: string; dryRun: boolean } {
  const args = process.argv.slice(2);
  let phase = "";
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--phase" && args[i + 1]) {
      phase = args[++i];
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }
  if (!phase) {
    console.error("Usage: npx tsx scripts/pixellab-generate.ts --phase <phase_name> [--dry-run]");
    process.exit(1);
  }
  return { phase, dryRun };
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec.toString().padStart(2, "0")}s`;
  return `${sec}s`;
}

async function apiPost(apiKey: string, endpoint: string, body: Record<string, unknown>): Promise<{ status: number; json: ApiResponse }> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status >= 400) {
    const text = await res.text();
    throw new Error(`API ${endpoint} returned ${res.status}: ${text}`);
  }
  const json = await res.json() as ApiResponse;
  return { status: res.status, json };
}

async function apiGet(apiKey: string, endpoint: string): Promise<{ status: number; json: ApiResponse }> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  if (res.status >= 400 && res.status !== 423) {
    const text = await res.text();
    throw new Error(`API ${endpoint} returned ${res.status}: ${text}`);
  }
  const json = await res.json() as ApiResponse;
  return { status: res.status, json };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollBackgroundJob(apiKey: string, jobId: string): Promise<ApiResponse> {
  while (true) {
    const { json } = await apiGet(apiKey, `/background-jobs/${jobId}`);
    const jobStatus = json.status as string | undefined;
    if (jobStatus === "completed") return json;
    if (jobStatus === "failed") throw new Error(`Background job ${jobId} failed: ${JSON.stringify(json)}`);
    process.stdout.write(".");
    await sleep(POLL_INTERVAL_MS);
  }
}

async function pollTileset(apiKey: string, tilesetId: string): Promise<ApiResponse> {
  while (true) {
    const { status, json } = await apiGet(apiKey, `/tilesets/${tilesetId}`);
    if (status === 200) return json;
    if (status === 423) {
      process.stdout.write(".");
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    throw new Error(`Unexpected status ${status} polling tileset ${tilesetId}: ${JSON.stringify(json)}`);
  }
}

function saveBuffer(buf: Buffer, filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buf);
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  saveBuffer(buf, filePath);
}

function rgbaToRawPng(base64: string, width: number, height: number): Buffer {
  // Save raw RGBA as a simple PNG-compatible format
  // For simplicity, just save the raw RGBA bytes — we'll convert with sharp if needed
  // Actually, let's just save as raw RGBA and rename to .rgba for now
  return Buffer.from(base64, "base64");
}

async function extractAndSaveImages(data: Record<string, unknown>, outputDir: string, prefix: string): Promise<string[]> {
  const absOutputDir = path.join(PROJECT_ROOT, outputDir);
  fs.mkdirSync(absOutputDir, { recursive: true });
  const savedFiles: string[] = [];

  // Handle rotation_urls (character GET response) — download PNGs from URLs
  if (data.rotation_urls && typeof data.rotation_urls === "object") {
    const urls = data.rotation_urls as Record<string, string>;
    for (const [direction, url] of Object.entries(urls)) {
      if (typeof url !== "string" || !url.startsWith("http")) continue;
      const filename = `${prefix}-${direction}.png`;
      const filePath = path.join(absOutputDir, filename);
      await downloadFile(url, filePath);
      savedFiles.push(path.relative(PROJECT_ROOT, filePath));
    }
  }

  // Handle animation_urls (character GET response after animation)
  if (data.animations && Array.isArray(data.animations)) {
    for (const anim of data.animations) {
      const a = anim as Record<string, unknown>;
      const animName = a.name as string || "anim";
      if (a.sprite_sheet_urls && typeof a.sprite_sheet_urls === "object") {
        const urls = a.sprite_sheet_urls as Record<string, string>;
        for (const [direction, url] of Object.entries(urls)) {
          if (typeof url !== "string" || !url.startsWith("http")) continue;
          const filename = `${prefix}-${animName}-${direction}.png`;
          const filePath = path.join(absOutputDir, filename);
          await downloadFile(url, filePath);
          savedFiles.push(path.relative(PROJECT_ROOT, filePath));
        }
      }
    }
  }

  // Handle image_url (map object GET response)
  if (typeof data.image_url === "string" && data.image_url.startsWith("http")) {
    const filename = `${prefix}.png`;
    const filePath = path.join(absOutputDir, filename);
    await downloadFile(data.image_url as string, filePath);
    savedFiles.push(path.relative(PROJECT_ROOT, filePath));
  }

  // Recursively find inline base64 image objects (tileset tiles, etc.)
  function walkSync(obj: unknown, keyPath: string): void {
    if (!obj || typeof obj !== "object") return;
    const rec = obj as Record<string, unknown>;

    // Handle base64 or rgba_bytes image data
    if (typeof rec.base64 === "string" && typeof rec.type === "string") {
      const w = rec.width as number | undefined;
      const h = rec.height as number | undefined;
      const ext = rec.type === "rgba_bytes" ? "rgba" : ((rec.format as string) || "png");
      const filename = `${prefix}${keyPath ? `-${keyPath}` : ""}.${ext}`;
      const filePath = path.join(absOutputDir, filename);
      saveBuffer(Buffer.from(rec.base64 as string, "base64"), filePath);
      // Also save dimensions for rgba files
      if (ext === "rgba" && w && h) {
        fs.writeFileSync(filePath + ".meta", JSON.stringify({ width: w, height: h }));
      }
      savedFiles.push(path.relative(PROJECT_ROOT, filePath));
      return;
    }

    // Recurse into arrays and objects
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => walkSync(item, `${keyPath}${keyPath ? "-" : ""}${i}`));
    } else {
      for (const [k, v] of Object.entries(rec)) {
        if (k === "usage" || k === "rotation_urls" || k === "animations" || k === "image_url") continue;
        walkSync(v, `${keyPath}${keyPath ? "-" : ""}${k}`);
      }
    }
  }

  walkSync(data, "");
  return savedFiles;
}

// ── Item processors ────────────────────────────────────────────────────────

async function processCreateCharacter(
  apiKey: string,
  item: PlanItem,
  _completedItems: Map<string, ResultEntry>
): Promise<ResultEntry> {
  const { json } = await apiPost(apiKey, "/create-character-with-4-directions", item.params);

  const characterId = json.character_id as string | undefined;
  const jobId = json.background_job_id as string | undefined;

  if (jobId) {
    await pollBackgroundJob(apiKey, jobId);
  }

  // Fetch the final character data
  let finalData: Record<string, unknown> = json;
  if (characterId) {
    const charRes = await apiGet(apiKey, `/characters/${characterId}`);
    finalData = charRes.json;
  }

  const files = await extractAndSaveImages(finalData as Record<string, unknown>, item.output, item.id);

  return {
    id: item.id,
    type: item.type,
    apiId: characterId || null,
    localPath: item.output,
    files,
    timestamp: new Date().toISOString(),
  };
}

async function processAnimateCharacter(
  apiKey: string,
  item: PlanItem,
  completedItems: Map<string, ResultEntry>
): Promise<ResultEntry> {
  // Get character_id from dependency
  const dep = completedItems.get(item.depends_on!);
  if (!dep?.apiId) {
    throw new Error(`Dependency "${item.depends_on}" has no API ID for animation`);
  }

  const body = {
    character_id: dep.apiId,
    ...item.params,
    async_mode: true,
  };

  const { json } = await apiPost(apiKey, "/characters/animations", body);

  // API returns background_job_ids (array) for animations
  const jobIds = json.background_job_ids as string[] | undefined;
  const absOutputDir = path.join(PROJECT_ROOT, item.output);
  fs.mkdirSync(absOutputDir, { recursive: true });
  const savedFiles: string[] = [];

  if (jobIds && jobIds.length > 0) {
    for (const jobId of jobIds) {
      const jobResult = await pollBackgroundJob(apiKey, jobId);
      const lr = jobResult.last_response as Record<string, unknown> | undefined;
      if (!lr) continue;

      const direction = lr.direction as string || "east";
      const animName = item.params.animation_name as string || "anim";

      // Download frame PNGs from storage_urls
      const storageUrls = lr.storage_urls as Record<string, unknown> | undefined;
      const frameUrls = storageUrls?.frames as string[] | undefined;
      if (frameUrls && frameUrls.length > 0) {
        for (let f = 0; f < frameUrls.length; f++) {
          const url = frameUrls[f];
          if (!url.startsWith("http")) continue;
          const filename = `${item.id}-${animName}-${direction}-frame${f}.png`;
          const filePath = path.join(absOutputDir, filename);
          await downloadFile(url, filePath);
          savedFiles.push(path.relative(PROJECT_ROOT, filePath));
        }
      }
    }
  }

  const files = savedFiles;

  return {
    id: item.id,
    type: item.type,
    apiId: dep.apiId,
    localPath: item.output,
    files,
    timestamp: new Date().toISOString(),
  };
}

async function processCreateTileset(
  apiKey: string,
  item: PlanItem,
  _completedItems: Map<string, ResultEntry>
): Promise<ResultEntry> {
  const { status, json } = await apiPost(apiKey, "/create-tileset-sidescroller", item.params);

  const tilesetId = (json.tileset_id || json.job_id) as string | undefined;
  if (!tilesetId) {
    throw new Error(`No tileset_id or job_id in response: ${JSON.stringify(json)}`);
  }

  // For 202 responses, poll until ready
  if (status === 202) {
    const tilesetRes = await pollTileset(apiKey, tilesetId);
    const files = await extractAndSaveImages(tilesetRes as Record<string, unknown>, item.output, item.id);
    return {
      id: item.id,
      type: item.type,
      apiId: tilesetId,
      localPath: item.output,
      files,
      timestamp: new Date().toISOString(),
    };
  }

  const files = await extractAndSaveImages(json as Record<string, unknown>, item.output, item.id);
  return {
    id: item.id,
    type: item.type,
    apiId: tilesetId,
    localPath: item.output,
    files,
    timestamp: new Date().toISOString(),
  };
}

async function processCreateMapObject(
  apiKey: string,
  item: PlanItem,
  _completedItems: Map<string, ResultEntry>
): Promise<ResultEntry> {
  const { json } = await apiPost(apiKey, "/map-objects", item.params);

  const objectId = json.object_id as string | undefined;
  const mapJobId = json.background_job_id as string | undefined;

  // Map objects are async — poll until done, then extract image from job result
  let jobResult: ApiResponse | null = null;
  if (mapJobId) {
    jobResult = await pollBackgroundJob(apiKey, mapJobId);
  }

  // The image is in the background job's last_response.image (base64 PNG)
  const absOutputDir = path.join(PROJECT_ROOT, item.output);
  fs.mkdirSync(absOutputDir, { recursive: true });
  const savedFiles: string[] = [];

  const lastResponse = jobResult?.last_response as Record<string, unknown> | undefined;
  if (lastResponse?.image && typeof lastResponse.image === "string") {
    const filePath = path.join(absOutputDir, `${item.id}.png`);
    saveBuffer(Buffer.from(lastResponse.image as string, "base64"), filePath);
    savedFiles.push(path.relative(PROJECT_ROOT, filePath));
  } else {
    // Fallback: try fetching from object endpoint or extracting inline data
    let finalData: Record<string, unknown> = json;
    if (objectId) {
      const objRes = await apiGet(apiKey, `/objects/${objectId}`);
      if (objRes.status === 200) {
        finalData = objRes.json;
      }
    }
    const extracted = await extractAndSaveImages(finalData, item.output, item.id);
    savedFiles.push(...extracted);
  }

  const files = savedFiles;

  return {
    id: item.id,
    type: item.type,
    apiId: objectId || null,
    localPath: item.output,
    files,
    timestamp: new Date().toISOString(),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const { phase, dryRun } = parseArgs();

  // Load plan
  const planPath = path.join(PROJECT_ROOT, "scripts", "pixellab-plan.json");
  if (!fs.existsSync(planPath)) {
    console.error(`Plan file not found: ${planPath}`);
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
  const items: PlanItem[] = plan[phase];
  if (!items || items.length === 0) {
    console.error(`Phase "${phase}" not found in plan or has no items.`);
    process.exit(1);
  }

  console.log(`\nPixelLab Asset Generator`);
  console.log(`Phase: ${phase} (${items.length} items)${dryRun ? " [DRY RUN]" : ""}\n`);

  if (dryRun) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const depStr = item.depends_on ? ` (depends on: ${item.depends_on})` : "";
      console.log(`[${i + 1}/${items.length}] ${item.type}: ${item.id}${depStr}`);
      console.log(`  Endpoint: ${getEndpointForType(item.type)}`);
      console.log(`  Params: ${JSON.stringify(item.params, null, 2).split("\n").join("\n  ")}`);
      console.log(`  Output: ${item.output}\n`);
    }
    console.log("Dry run complete. No API calls were made.");
    return;
  }

  // Load API key (only when not dry-run)
  const apiKey = loadApiKey();

  // Load existing results
  const resultsPath = path.join(PROJECT_ROOT, "scripts", "pixellab-results.json");
  let results: Record<string, ResultEntry> = {};
  if (fs.existsSync(resultsPath)) {
    results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  }

  const completedItems = new Map<string, ResultEntry>();
  // Seed completed items from existing results
  for (const [key, entry] of Object.entries(results)) {
    completedItems.set(key, entry);
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = getLabel(item);

    // Skip already-completed items
    if (completedItems.has(item.id)) {
      console.log(`[${i + 1}/${items.length}] ${label}... skipped (already done)`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${items.length}] ${label}...`);
    const start = Date.now();

    try {
      // Wait for dependency
      if (item.depends_on && !completedItems.has(item.depends_on)) {
        throw new Error(`Dependency "${item.depends_on}" not yet completed`);
      }

      let result: ResultEntry;
      switch (item.type) {
        case "create_character":
          result = await processCreateCharacter(apiKey, item, completedItems);
          break;
        case "animate_character":
          result = await processAnimateCharacter(apiKey, item, completedItems);
          break;
        case "create_sidescroller_tileset":
          result = await processCreateTileset(apiKey, item, completedItems);
          break;
        case "create_map_object":
          result = await processCreateMapObject(apiKey, item, completedItems);
          break;
        default:
          throw new Error(`Unknown item type: ${item.type}`);
      }

      completedItems.set(item.id, result);
      results[item.id] = result;

      const elapsed = formatDuration(Date.now() - start);
      console.log(` done (${elapsed})${result.files.length > 0 ? ` — ${result.files.length} file(s)` : ""}`);
    } catch (err) {
      const elapsed = formatDuration(Date.now() - start);
      console.log(` FAILED (${elapsed})`);
      console.error(`  Error: ${(err as Error).message}\n`);
    }
  }

  // Save results
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`\nResults saved to ${path.relative(PROJECT_ROOT, resultsPath)}`);
}

function getEndpointForType(type: string): string {
  switch (type) {
    case "create_character": return "POST /create-character-with-4-directions";
    case "animate_character": return "POST /characters/animations";
    case "create_sidescroller_tileset": return "POST /create-tileset-sidescroller";
    case "create_map_object": return "POST /map-objects";
    default: return `UNKNOWN (${type})`;
  }
}

function getLabel(item: PlanItem): string {
  switch (item.type) {
    case "create_character": return `Creating character "${item.params.name || item.id}"`;
    case "animate_character": return `Animating "${item.depends_on}" (${item.params.animation_name})`;
    case "create_sidescroller_tileset": return `Creating tileset "${item.id}"`;
    case "create_map_object": return `Creating map object "${item.id}"`;
    default: return `Processing "${item.id}"`;
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
