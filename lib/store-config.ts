import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export interface StoreConfig {
    storeName: string
}

const defaultStoreConfig: StoreConfig = {
    storeName: 'MobiStock',
}

const configDir = path.join(process.cwd(), 'config')
const configPath = path.join(configDir, 'config.json')

function normalizeStoreConfig(value: unknown): StoreConfig {
    if (!value || typeof value !== 'object') {
        return defaultStoreConfig
    }

    const storeName =
        typeof (value as { storeName?: unknown }).storeName === 'string'
            ? (value as { storeName: string }).storeName.trim()
            : ''

    return {
        storeName: storeName || defaultStoreConfig.storeName,
    }
}

async function ensureConfigFile() {
    await mkdir(configDir, { recursive: true })
    try {
        await readFile(configPath, 'utf-8')
    } catch {
        await writeFile(
            configPath,
            JSON.stringify(defaultStoreConfig, null, 4),
            'utf-8'
        )
    }
}

export async function readStoreConfig(): Promise<StoreConfig> {
    await ensureConfigFile()
    const fileContent = await readFile(configPath, 'utf-8')
    const parsed = JSON.parse(fileContent) as unknown
    return normalizeStoreConfig(parsed)
}

export async function writeStoreConfig(
    input: Partial<StoreConfig>
): Promise<StoreConfig> {
    await ensureConfigFile()
    const current = await readStoreConfig()
    const merged = normalizeStoreConfig({
        ...current,
        ...input,
    })
    await writeFile(configPath, JSON.stringify(merged, null, 4), 'utf-8')
    return merged
}
