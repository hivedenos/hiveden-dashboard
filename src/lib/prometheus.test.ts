import { describe, expect, test } from "vitest";
import { buildContainerRegex, normalizeContainerName } from "./prometheus";

describe("prometheus helpers", () => {
  test("normalizes container names", () => {
    expect(normalizeContainerName("/Jellyfin")).toBe("jellyfin");
    expect(normalizeContainerName("redis")).toBe("redis");
    expect(normalizeContainerName(undefined)).toBe("");
  });

  test("builds safe regex matcher", () => {
    expect(buildContainerRegex("/my.app")).toBe("^/?my\\.app$");
    expect(buildContainerRegex("")).toBe(".*");
  });
});
