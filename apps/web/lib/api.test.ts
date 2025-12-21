import { describe, it, expect, vi } from "vitest";
import { fetchTracks } from "./api";

describe("api client", () => {
  it("calls tracks endpoint", async () => {
    const mock = vi.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => []
    } as any);
    await fetchTracks();
    expect(mock).toHaveBeenCalledWith(expect.stringContaining("/v1/tracks"), { cache: "no-cache" });
    mock.mockRestore();
  });
});
