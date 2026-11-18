/** stdout is the MCP transport: logs go to stderr only. */
export function log(...args: unknown[]): void {
  console.error('[interclaude]', ...args)
}
