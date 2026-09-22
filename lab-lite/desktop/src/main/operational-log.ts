import { appendFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from "node:fs";
import path from "node:path";

type FieldValue = string | number | boolean | null;
const SAFE_FIELDS = new Set([
  "appVersion", "category", "checkpoint", "conflicted", "count", "durationMs",
  "format", "fromVersion", "pending", "result", "toVersion",
]);

export class OperationalLogger {
  readonly filePath: string;

  constructor(private readonly directory: string, private readonly maxBytes = 5 * 1024 * 1024, private readonly retainedFiles = 5) {
    mkdirSync(directory, { recursive: true });
    this.filePath = path.join(directory, "operations.jsonl");
  }

  write(event: string, fields: Record<string, FieldValue> = {}) {
    this.rotateIfNeeded();
    const safeFields = Object.fromEntries(Object.entries(fields).filter(([key]) => SAFE_FIELDS.has(key)));
    appendFileSync(this.filePath, `${JSON.stringify({ at: new Date().toISOString(), event, ...safeFields })}\n`, { encoding: "utf8", mode: 0o600 });
  }

  private rotateIfNeeded() {
    if (!existsSync(this.filePath) || statSync(this.filePath).size < this.maxBytes) return;
    rmSync(`${this.filePath}.${this.retainedFiles}`, { force: true });
    for (let index = this.retainedFiles - 1; index >= 1; index -= 1) {
      const source = `${this.filePath}.${index}`;
      const target = `${this.filePath}.${index + 1}`;
      if (existsSync(source)) renameSync(source, target);
    }
    renameSync(this.filePath, `${this.filePath}.1`);
  }
}
