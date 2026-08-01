import fs from "fs";
import path from "path";

const LOG_DIR = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "tool-calls.jsonl");

fs.mkdirSync(LOG_DIR, { recursive: true });

export function logToolCall(tool: string, args: unknown): void {
  const entry = JSON.stringify({ tool, args, timestamp: new Date().toISOString() });
  fs.appendFileSync(LOG_FILE, entry + "\n");
}
