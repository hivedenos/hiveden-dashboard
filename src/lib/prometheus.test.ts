import { describe, expect, test } from "vitest";
import { buildContainerRegex, normalizeContainerName, resolvePrometheusUrl } from "./prometheus";

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

  test("resolves explicit and default prometheus urls", () => {
    expect(resolvePrometheusUrl("http://prometheus.example.com")).toBe("http://prometheus.example.com");
    expect(resolvePrometheusUrl("prometheus.internal.local:9090")).toBe("http://prometheus.internal.local:9090");
    expect(resolvePrometheusUrl()).toBe("");
  });
});
