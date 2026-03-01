import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'

export interface StoreConfig {
    storeName: string
}

const defaultStoreConfig: StoreConfig = {
    storeName: 'MobiStock',
}

const configDir = path.join(process.cwd(), 'config')
const bundledConfigPath = path.join(configDir, 'config.json')
const runtimeConfigPath =
    process.env.NODE_ENV === 'production'
        ? '/tmp/mobistock-config.json'
        : bundledConfigPath

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

export async function readStoreConfig(): Promise<StoreConfig> {
    try {
        const runtimeContent = await readFile(runtimeConfigPath, 'utf-8')
        const runtimeParsed = JSON.parse(runtimeContent) as unknown
        return normalizeStoreConfig(runtimeParsed)
    } catch {
        try {
            const bundledContent = await readFile(bundledConfigPath, 'utf-8')
            const bundledParsed = JSON.parse(bundledContent) as unknown
            return normalizeStoreConfig(bundledParsed)
        } catch {
            return defaultStoreConfig
        }
    }
}

export async function writeStoreConfig(
    input: Partial<StoreConfig>
): Promise<StoreConfig> {
    const current = await readStoreConfig()
    const merged = normalizeStoreConfig({
        ...current,
        ...input,
    })

    if (runtimeConfigPath === bundledConfigPath) {
        await mkdir(configDir, { recursive: true })
    }

    await writeFile(runtimeConfigPath, JSON.stringify(merged, null, 4), 'utf-8')

    return merged
}
