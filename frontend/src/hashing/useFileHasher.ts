import { useCallback, useEffect, useRef, useState } from "react";
import type { FileHashes } from "./hashFile";

export interface HashState {
  status: "idle" | "hashing" | "complete" | "error" | "cancelled";
  progress: number;
  hashes: FileHashes | null;
  errorKind: "worker" | "file" | null;
}
const initialState: HashState = { status: "idle", progress: 0, hashes: null, errorKind: null };

export function useFileHasher(includeLegacy = true) {
  const [state, setState] = useState<HashState>(initialState);
  const workerRef = useRef<Worker | null>(null);
  const stop = useCallback(() => { workerRef.current?.terminate(); workerRef.current = null; }, []);
  useEffect(() => stop, [stop]);
  const hashFile = useCallback((file: File) => {
    stop();
    setState({ ...initialState, status: "hashing" });
    try {
      const worker = new Worker(new URL("./hash.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<{ type: "progress" | "complete" | "error"; progress: number; hashes: FileHashes }>) => {
        if (workerRef.current !== worker) return;
        if (event.data.type === "progress") setState({ ...initialState, status: "hashing", progress: event.data.progress });
        else {
          setState(event.data.type === "complete" ? { ...initialState, status: "complete", progress: 100, hashes: event.data.hashes } : { ...initialState, status: "error", errorKind: "file" });
          stop();
        }
      };
      worker.onerror = () => { if (workerRef.current === worker) { stop(); setState({ ...initialState, status: "error", errorKind: "worker" }); } };
      worker.postMessage({ file, includeLegacy });
    } catch { stop(); setState({ ...initialState, status: "error", errorKind: "worker" }); }
  }, [includeLegacy, stop]);
  const cancel = useCallback(() => { stop(); setState({ ...initialState, status: "cancelled" }); }, [stop]);
  const reset = useCallback(() => { stop(); setState(initialState); }, [stop]);
  return { state, hashFile, cancel, reset };
}
