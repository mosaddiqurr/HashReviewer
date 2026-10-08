import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupReputation, reputationAvailable } from "../api/reputation";

const sha256 = "a".repeat(64);
const report = { status: "found", sha256, verdict: "No known detections", explanation: "This does not establish safety.", stats: { malicious: 0, suspicious: 0, undetected: 60, harmless: 0 }, analyzedAt: null };
const signal = () => new AbortController().signal;
function respond(body: unknown, status = 200) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
afterEach(() => vi.unstubAllGlobals());

describe("reputation privacy and response validation", () => {
  it("requests only a same-origin fingerprint with no body, credentials, or referrer", async () => {
    const fetch = respond(report);
    const abort = signal();
    expect(await lookupReputation(sha256, abort)).toEqual(report);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(`/api/reputation/${sha256}`, {
      signal: abort, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", headers: { Accept: "application/json" },
    });
  });
  it("availability sends no file metadata", async () => {
    const fetch = respond({ available: true });
    expect(await reputationAvailable(signal())).toBe(true);
    expect(fetch.mock.calls[0][0]).toBe("/api/reputation/status");
  });
  it("rejects invalid fingerprints without a request", async () => {
    const fetch = respond(report);
    await expect(lookupReputation("invalid", signal())).rejects.toThrow("Reputation lookup is unavailable.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([
    { ...report, sha256: "b".repeat(64) },
    { ...report, stats: { ...report.stats, malicious: 1 } },
    { ...report, stats: { ...report.stats, suspicious: 1 } },
    { ...report, stats: { ...report.stats, undetected: 100001 } },
    { ...report, stats: { ...report.stats, undetected: 0 } },
    { ...report, stats: { ...report.stats, undetected: -1 } },
    { ...report, stats: { ...report.stats, undetected: "60" } },
    { ...report, analyzedAt: "not-a-date" },
    { ...report, status: "not_found", stats: null },
    null, [], {},
  ])("rejects malformed or contradictory reports %j", async (body) => {
    respond(body);
    await expect(lookupReputation(sha256, signal())).rejects.toThrow("Reputation lookup is unavailable.");
  });
  it("accepts an unknown fingerprint without claiming safety", async () => {
    const unknown = { ...report, status: "not_found", verdict: "Unknown", stats: null };
    respond(unknown);
    expect(await lookupReputation(sha256, signal())).toEqual(unknown);
  });
  it.each([401, 403, 429, 503])("sanitizes HTTP %i errors", async (status) => {
    respond({ message: "private provider details" }, status);
    await expect(lookupReputation(sha256, signal())).rejects.toThrow("Reputation lookup is unavailable.");
  });
});
