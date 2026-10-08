import type { FileHashes } from "../hashing/hashFile";

export const RECEIPT_FORMAT = "hashreviewer.integrity-receipt";
export const MAX_RECEIPT_BYTES = 16 * 1024;
export interface IntegrityReceipt {
  format: typeof RECEIPT_FORMAT;
  version: 1;
  filename: string;
  size: number;
  sha256: string;
  sha1?: string;
  md5?: string;
  createdAt: string;
}

export function createReceipt(file: Pick<File, "name" | "size">, hashes: FileHashes, now = new Date()): IntegrityReceipt {
  return { format: RECEIPT_FORMAT, version: 1, filename: file.name, size: file.size, ...hashes, createdAt: now.toISOString() };
}

export function parseReceipt(text: string): IntegrityReceipt {
  const invalid = () => { throw new Error("The receipt is invalid."); };
  if (new TextEncoder().encode(text).length > MAX_RECEIPT_BYTES) return invalid();
  let input: unknown;
  try { input = JSON.parse(text); } catch { return invalid(); }
  if (typeof input !== "object" || input === null || Array.isArray(input)) return invalid();
  const data = input as Record<string, unknown>;
  const allowed = ["format", "version", "filename", "size", "sha256", "sha1", "md5", "createdAt"];
  if (Object.keys(data).some((key) => !allowed.includes(key)) || data.format !== RECEIPT_FORMAT || data.version !== 1 ||
      typeof data.filename !== "string" || !data.filename.length || data.filename.length > 1024 ||
      typeof data.size !== "number" || !Number.isSafeInteger(data.size) || data.size < 0 ||
      typeof data.sha256 !== "string" || !/^[a-f\d]{64}$/i.test(data.sha256) ||
      typeof data.createdAt !== "string" || !Number.isFinite(Date.parse(data.createdAt))) return invalid();
  if (new Date(data.createdAt).toISOString() !== data.createdAt) return invalid();
  for (const [key, length] of [["sha1", 40], ["md5", 32]] as const) {
    if (data[key] !== undefined && (typeof data[key] !== "string" || !new RegExp(`^[a-f\\d]{${length}}$`, "i").test(data[key]))) return invalid();
  }
  return {
    format: RECEIPT_FORMAT, version: 1, filename: data.filename, size: data.size, sha256: data.sha256.toLowerCase(), createdAt: data.createdAt,
    ...(typeof data.sha1 === "string" ? { sha1: data.sha1.toLowerCase() } : {}),
    ...(typeof data.md5 === "string" ? { md5: data.md5.toLowerCase() } : {}),
  };
}

export function verifyReceipt(file: Pick<File, "name" | "size">, sha256: string, receipt: IntegrityReceipt) {
  const sha256Matches = sha256 === receipt.sha256;
  const sizeMatches = file.size === receipt.size;
  return { verified: sha256Matches && sizeMatches, sha256Matches, sizeMatches, filenameMatches: file.name === receipt.filename };
}

export function compareFiles(a: { size: number; sha256: string }, b: { size: number; sha256: string }) {
  return { identical: a.sha256 === b.sha256 && a.size === b.size, sizeDifference: b.size - a.size };
}

export function downloadReceipt(receipt: IntegrityReceipt) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2) + "\n"], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  const safeName = [...receipt.filename].map((char) => char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? "_" : char).join("").slice(0, 128);
  anchor.download = `${safeName}.integrity.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
