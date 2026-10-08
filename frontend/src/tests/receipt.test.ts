// @vitest-environment node
import { describe, expect, it } from "vitest";
import { compareFiles, createReceipt, MAX_RECEIPT_BYTES, parseReceipt, verifyReceipt } from "../integrity/receipt";

const file = { name: "hello.txt", size: 3 };
const hash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const receipt = createReceipt(file, { sha256: hash }, new Date("2026-10-04T00:00:00.000Z"));

describe("integrity receipts", () => {
  it("round-trips an unsigned record with no file contents", () => {
    expect(parseReceipt(JSON.stringify(receipt))).toEqual(receipt);
    expect(Object.keys(receipt).sort()).toEqual(["format", "version", "filename", "size", "sha256", "createdAt"].sort());
  });
  it("accepts optional legacy hashes and normalizes casing", () => {
    const enriched = { ...receipt, sha256: hash.toUpperCase(), sha1: "A".repeat(40), md5: "B".repeat(32) };
    expect(parseReceipt(JSON.stringify(enriched))).toEqual({ ...receipt, sha1: "a".repeat(40), md5: "b".repeat(32) });
  });
  it.each([
    { format: "certificate" }, { version: 2 }, { filename: "" }, { filename: 123 },
    { size: -1 }, { size: 1.5 }, { size: "3" }, { size: Number.MAX_SAFE_INTEGER + 1 },
    { sha256: "invalid" }, { sha256: "g".repeat(64) }, { sha1: "a".repeat(39) }, { md5: null },
    { createdAt: "not-a-date" }, { createdAt: "2026-02-30T00:00:00.000Z" }, { extra: "unsupported" },
  ])("rejects invalid metadata %j", (changes) => {
    expect(() => parseReceipt(JSON.stringify({ ...receipt, ...changes }))).toThrow("The receipt is invalid.");
  });
  it.each(["{", "null", "[]", "3", '"receipt"', "{}"])('rejects invalid record %s', (text) => {
    expect(() => parseReceipt(text)).toThrow("The receipt is invalid.");
  });
  it("bounds receipt input size", () => {
    expect(() => parseReceipt(" ".repeat(MAX_RECEIPT_BYTES + 1))).toThrow("The receipt is invalid.");
  });
  it("verifies matching bytes after renaming", () => {
    expect(verifyReceipt(file, hash, receipt).verified).toBe(true);
    expect(verifyReceipt({ ...file, name: "renamed.txt" }, hash, receipt)).toEqual({
      verified: true, sha256Matches: true, sizeMatches: true, filenameMatches: false,
    });
  });
  it("reports changed contents with unchanged length", () => {
    expect(verifyReceipt(file, "a".repeat(64), receipt)).toEqual({
      verified: false, sha256Matches: false, sizeMatches: true, filenameMatches: true,
    });
  });
  it("rejects inconsistent size metadata", () => {
    expect(verifyReceipt(file, hash, { ...receipt, size: 4 }).verified).toBe(false);
  });
  it("compares fingerprints and sizes", () => {
    expect(compareFiles({ size: 3, sha256: hash }, { size: 3, sha256: hash })).toEqual({ identical: true, sizeDifference: 0 });
    expect(compareFiles({ size: 3, sha256: hash }, { size: 3, sha256: "a".repeat(64) }).identical).toBe(false);
    expect(compareFiles({ size: 3, sha256: hash }, { size: 5, sha256: hash })).toEqual({ identical: false, sizeDifference: 2 });
  });
});
