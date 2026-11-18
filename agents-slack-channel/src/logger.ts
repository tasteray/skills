import { type Logger, LogLevel } from '@slack/logger';

const ORDER: Record<LogLevel, number> = {
	[LogLevel.DEBUG]: 0,
	[LogLevel.INFO]: 1,
	[LogLevel.WARN]: 2,
	[LogLevel.ERROR]: 3,
};

function levelFromEnv(): LogLevel {
	const v = (process.env.AGENTS_SLACK_LOG_LEVEL ?? '').toLowerCase();
	return (Object.values(LogLevel) as string[]).includes(v) ? (v as LogLevel) : LogLevel.INFO;
}

/**
 * Logger that writes only to stderr. stdout carries the MCP stdio transport,
 * so the Slack SDK's default console logger (which uses stdout) must not be used.
 */
export function stderrLogger(name: string): Logger {
	let level = levelFromEnv();
	let label = name;
	const write = (lvl: LogLevel, msg: unknown[]) => {
		if (ORDER[lvl] < ORDER[level]) return;
		const text = msg
			.map(m => (m instanceof Error ? (m.stack ?? m.message) : typeof m === 'string' ? m : JSON.stringify(m)))
			.join(' ');
		process.stderr.write(`[${label}] ${lvl}: ${text}\n`);
	};
	return {
		debug: (...m) => write(LogLevel.DEBUG, m),
		info: (...m) => write(LogLevel.INFO, m),
		warn: (...m) => write(LogLevel.WARN, m),
		error: (...m) => write(LogLevel.ERROR, m),
		setLevel: l => {
			level = l;
		},
		getLevel: () => level,
		setName: n => {
			label = n;
		},
	};
}
