// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { calculateHashes, CHUNK_SIZE } from "../hashing/hashFile";

describe("local file hashing", () => {
  it.each(["", "abc", "HashReviewer\n", "বাংলা 🔎"])("matches independent Node hashes for %j", async (text) => {
    const actual = await calculateHashes(new Blob([text]));
    for (const algorithm of ["sha256", "sha1", "md5"] as const) {
      expect(actual[algorithm]).toBe(createHash(algorithm).update(text).digest("hex"));
    }
  });
  it.each([CHUNK_SIZE - 1, CHUNK_SIZE, CHUNK_SIZE + 1, CHUNK_SIZE * 2 + 63])("streams %i binary bytes correctly", async (size) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i % 251;
    const progress: number[] = [];
    const actual = await calculateHashes(new Blob([bytes]), true, (value) => progress.push(value));
    for (const algorithm of ["sha256", "sha1", "md5"] as const) {
      expect(actual[algorithm]).toBe(createHash(algorithm).update(bytes).digest("hex"));
    }
    expect(progress.at(-1)).toBe(100);
    expect(progress.length).toBe(Math.ceil(size / CHUNK_SIZE));
  });
  it("verification and comparison need only SHA-256", async () => {
    expect(await calculateHashes(new Blob(["abc"]), false)).toEqual({ sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" });
  });
  it("rejects unreadable chunks", async () => {
    const file = { size: 1, slice: () => ({ arrayBuffer: () => Promise.reject(new Error("read failed")) }) };
    await expect(calculateHashes(file as unknown as Blob)).rejects.toThrow("read failed");
  });
});
