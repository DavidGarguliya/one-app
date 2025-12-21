import { describe, expect, it } from "vitest";
import { usePlayerStore } from "./store";

describe("player store", () => {
  it("sets queue and plays", () => {
    const store = usePlayerStore.getState();
    store.setQueue([{ id: "1", url: "https://example.com/a.mp3", title: "A" }], 0);
    expect(usePlayerStore.getState().queue.length).toBe(1);
  });
});
