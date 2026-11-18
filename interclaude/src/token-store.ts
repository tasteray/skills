import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export const TOKEN_RE = /^ah1\.[0-9a-f-]{8,64}\.[A-Za-z0-9_-]{40,64}$/

export async function readToken(path: string): Promise<string | undefined> {
  try {
    const t = (await readFile(path, 'utf8')).trim()
    return TOKEN_RE.test(t) ? t : undefined
  } catch {
    return undefined
  }
}

/** Token file is private to the user: directory 0700, file 0600. */
export async function writeToken(path: string, token: string): Promise<void> {
  if (!TOKEN_RE.test(token)) throw new Error('invalid hub token format')
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(path, token + '\n', { mode: 0o600 })
  await chmod(path, 0o600)
}
