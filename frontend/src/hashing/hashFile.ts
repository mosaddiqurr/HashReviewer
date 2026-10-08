import { sha256 } from "@noble/hashes/sha2.js";
import { md5, sha1 } from "@noble/hashes/legacy.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export interface FileHashes { sha256: string; sha1?: string; md5?: string }
export const CHUNK_SIZE = 4 * 1024 * 1024;

// Preserve incremental hashing: one read per chunk, outside the UI thread.
export async function calculateHashes(
  file: Blob,
  includeLegacy = true,
  onProgress: (progress: number) => void = () => {},
): Promise<FileHashes> {
  const primary = sha256.create();
  const legacySha1 = includeLegacy ? sha1.create() : null;
  const legacyMd5 = includeLegacy ? md5.create() : null;
  try {
    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const chunk = new Uint8Array(await file.slice(offset, end).arrayBuffer());
      primary.update(chunk);
      legacySha1?.update(chunk);
      legacyMd5?.update(chunk);
      onProgress(Math.floor(end / file.size * 100));
    }
    return {
      sha256: bytesToHex(primary.digest()),
      ...(legacySha1 && legacyMd5 ? { sha1: bytesToHex(legacySha1.digest()), md5: bytesToHex(legacyMd5.digest()) } : {}),
    };
  } finally {
    primary.destroy();
    legacySha1?.destroy();
    legacyMd5?.destroy();
  }
}
