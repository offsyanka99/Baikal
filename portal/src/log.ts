/**
 * Portal console logger. Level comes from baikal.yaml / env via /api/ui or /api/me.
 * Levels: off | error | warn | info | debug (default off).
 */

export type LogLevel = "off" | "error" | "warn" | "info" | "debug";

const LEVEL_ORDER: Record<LogLevel, number> = {
  off: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

let currentLevel: LogLevel = "off";

const PREFIX = "[baikal-portal]";

export function parseLogLevel(raw: string | null | undefined): LogLevel {
  const v = (raw || "off").toLowerCase().trim();
  if (v === "error" || v === "warn" || v === "info" || v === "debug" || v === "off") {
    return v;
  }
  return "off";
}

export function setLogLevel(level: string | null | undefined): LogLevel {
  currentLevel = parseLogLevel(level);
  if (currentLevel !== "off") {
    // Always announce when logging is enabled (uses console.info so it shows)
    // eslint-disable-next-line no-console
    console.info(PREFIX, `log level = ${currentLevel}`);
  }
  return currentLevel;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function enabled(min: LogLevel): boolean {
  return LEVEL_ORDER[currentLevel] >= LEVEL_ORDER[min];
}

function emit(
  min: LogLevel,
  method: "error" | "warn" | "info" | "debug",
  message: string,
  data?: unknown,
): void {
  if (!enabled(min)) return;
  const args: unknown[] = [PREFIX, message];
  if (data !== undefined) args.push(data);
  // Map debug → console.debug; others match
  // eslint-disable-next-line no-console
  console[method](...args);
}

/**
 * Structured app events (navigation, CRUD, bootstrap). Logged at info.
 */
export function logEvent(
  name: string,
  data?: Record<string, unknown> | null,
): void {
  if (!enabled("info")) return;
  if (data && Object.keys(data).length > 0) {
    // eslint-disable-next-line no-console
    console.info(PREFIX, `event:${name}`, data);
  } else {
    // eslint-disable-next-line no-console
    console.info(PREFIX, `event:${name}`);
  }
}

export const log = {
  error(message: string, data?: unknown): void {
    emit("error", "error", message, data);
  },
  warn(message: string, data?: unknown): void {
    emit("warn", "warn", message, data);
  },
  info(message: string, data?: unknown): void {
    emit("info", "info", message, data);
  },
  debug(message: string, data?: unknown): void {
    emit("debug", "debug", message, data);
  },
  event: logEvent,
};
