export interface ReputationResult {
  status: "found" | "not_found";
  sha256: string;
  verdict: "Suspicious" | "No known detections" | "Unknown" | "No analysis available";
  explanation: string;
  stats: { malicious: number; suspicious: number; undetected: number; harmless: number } | null;
  analyzedAt: string | null;
}

async function request(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Reputation lookup is unavailable.");
  return response.json();
}

export async function reputationAvailable(signal: AbortSignal): Promise<boolean> {
  const data = await request("/api/reputation/status", signal);
  return typeof data === "object" && data !== null && "available" in data && data.available === true;
}

export async function lookupReputation(sha256: string, signal: AbortSignal): Promise<ReputationResult> {
  if (!/^[a-f\d]{64}$/.test(sha256)) throw new Error("Reputation lookup is unavailable.");
  const data = await request(`/api/reputation/${sha256}`, signal);
  if (typeof data !== "object" || data === null) throw new Error("Reputation lookup is unavailable.");
  const result = data as ReputationResult;
  if (result.sha256 !== sha256 || !["found", "not_found"].includes(result.status) ||
      !["Suspicious", "No known detections", "Unknown", "No analysis available"].includes(result.verdict) ||
      typeof result.explanation !== "string" || result.explanation.length > 600 ||
      (result.analyzedAt !== null && (typeof result.analyzedAt !== "string" || !Number.isFinite(Date.parse(result.analyzedAt))))) throw new Error("Reputation lookup is unavailable.");
  if (result.status === "found" && (!result.stats || ["malicious", "suspicious", "undetected", "harmless"].some((key) => {
    const count = result.stats?.[key as keyof NonNullable<ReputationResult["stats"]>];
    return typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 || count > 100_000;
  }))) throw new Error("Reputation lookup is unavailable.");
  if (result.status === "found" && result.stats) {
    const expectedVerdict = result.stats.malicious || result.stats.suspicious ? "Suspicious"
      : result.stats.undetected || result.stats.harmless ? "No known detections" : "No analysis available";
    if (result.verdict !== expectedVerdict) throw new Error("Reputation lookup is unavailable.");
  }
  if (result.status === "not_found" && (result.stats !== null || result.verdict !== "Unknown")) throw new Error("Reputation lookup is unavailable.");
  return result;
}
