import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Reads the canonical privacy policy from `landing/content/privacy-policy.md`.
 *
 * That file is a copy of `<repo-root>/docs/privacy-policy.md`, refreshed by the
 * `sync:docs` npm script that runs automatically on `predev` and `prebuild`.
 * Keeping the synced copy inside `landing/` avoids fighting Vercel's
 * "include only the root directory" deployment rule — the source of truth
 * still lives in /docs, but we read from a colocated copy at runtime.
 */
const PRIVACY_PATH = path.join(process.cwd(), 'content', 'privacy-policy.md');

export async function loadPrivacyPolicy(): Promise<string> {
  return fs.readFile(PRIVACY_PATH, 'utf8');
}
