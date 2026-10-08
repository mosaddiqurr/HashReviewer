/// <reference lib="webworker" />
import { calculateHashes } from "./hashFile";

self.onmessage = async (event: MessageEvent<{ file: File; includeLegacy: boolean }>) => {
  try {
    const hashes = await calculateHashes(event.data.file, event.data.includeLegacy,
      (progress) => self.postMessage({ type: "progress", progress }));
    self.postMessage({ type: "complete", hashes });
  } catch { self.postMessage({ type: "error" }); }
};
