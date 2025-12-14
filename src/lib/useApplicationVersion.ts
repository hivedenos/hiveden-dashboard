"use client";

import { useState, useEffect } from "react";
import { getVersion } from "@/actions/info";
import type { VersionInfo as ClientVersionInfo } from "@/lib/client";

interface VersionInfo {
  rawVersion: string;
  backendVersion: string;
  frontendVersion: string;
  isLoading: boolean;
  error: string | null;
}

export function useApplicationVersion(): VersionInfo {
  const [rawVersion, setRawVersion] = useState<string>("");
  const [backendVersion, setBackendVersion] = useState<string>("Unknown Version");
  const [frontendVersion, setFrontendVersion] = useState<string>("test");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set frontend version from env
    setFrontendVersion(process.env.NEXT_PUBLIC_APP_VERSION || "test");

    const fetchVersion = async () => {
      try {
        const response = await getVersion();
        console.log("Version: ", response);
        const data = response.data as ClientVersionInfo; // Typed cast
        if (data?.version) {
          const version = data.version;
          setRawVersion(version);

          let displayVersion = version;
          if (version.startsWith("v")) {
            displayVersion = version; // e.g. v1.2.3
          } else if (/[0-9a-fA-F]{7}/.test(version)) {
            displayVersion = `${version}`; // e.g. a1b2c3d
          } else if (version.toLowerCase() === "test") {
            displayVersion = "Test Build";
          } else {
            displayVersion = `${version}`;
          }
          setBackendVersion(displayVersion);
        } else {
          setBackendVersion("Unknown Version");
        }
      } catch (err) {
        console.error("Failed to fetch application version:", err);
        setError("Failed to load version");
        setBackendVersion("Unknown Version");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { rawVersion, backendVersion, frontendVersion, isLoading, error };
}
