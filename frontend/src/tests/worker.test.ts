import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFileHasher } from "../hashing/useFileHasher";

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { TestWorker.instances.push(this); }
  complete(hash: string) { this.onmessage?.({ data: { type: "complete", hashes: { sha256: hash } } } as MessageEvent); }
}

beforeEach(() => { TestWorker.instances = []; vi.stubGlobal("Worker", TestWorker); });
afterEach(() => vi.unstubAllGlobals());

describe("worker lifetime and stale results", () => {
  it("replacement files cannot receive a previous file's digest", () => {
    const { result } = renderHook(() => useFileHasher(false));
    act(() => result.current.hashFile(new File(["first"], "first.txt")));
    const first = TestWorker.instances[0];
    act(() => result.current.hashFile(new File(["second"], "second.txt")));
    expect(first.terminate).toHaveBeenCalledOnce();
    act(() => first.complete("wrong digest"));
    expect(result.current.state.hashes).toBeNull();
    act(() => TestWorker.instances[1].complete("correct digest"));
    expect(result.current.state.hashes?.sha256).toBe("correct digest");
  });
  it("cancelling discards a late result and allows restarting", () => {
    const { result } = renderHook(() => useFileHasher());
    act(() => result.current.hashFile(new File(["file"], "file.txt")));
    const worker = TestWorker.instances[0];
    act(() => result.current.cancel());
    act(() => worker.complete("late digest"));
    expect(result.current.state).toMatchObject({ status: "cancelled", hashes: null });
    expect(worker.terminate).toHaveBeenCalledOnce();
    act(() => result.current.hashFile(new File(["new"], "new.txt")));
    expect(result.current.state.status).toBe("hashing");
  });
  it("navigation releases a running worker", () => {
    const { result, unmount } = renderHook(() => useFileHasher());
    act(() => result.current.hashFile(new File(["file"], "file.txt")));
    unmount();
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
  it("worker loading errors clear partial hashes", () => {
    const { result } = renderHook(() => useFileHasher());
    act(() => result.current.hashFile(new File(["file"], "file.txt")));
    act(() => TestWorker.instances[0].onerror?.(new ErrorEvent("error")));
    expect(result.current.state).toMatchObject({ status: "error", hashes: null });
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  });
});
