"use client";

import { useEffect, useRef, useState } from "react";

const BONFIDA_API = "https://sns-sdk-proxy.bonfida.workers.dev";

export function useSolDomain(name: string | undefined) {
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!name) {
      setData(null);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    const id = ++abortRef.current;
    setIsLoading(true);
    setIsError(false);
    setData(null);

    const controller = new AbortController();

    (async () => {
      try {
        // Strip .sol suffix for the API
        const domain = name.endsWith(".sol") ? name.slice(0, -4) : name;
        const res = await fetch(`${BONFIDA_API}/resolve/${domain}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        // The API returns { s: "ok", result: "<pubkey>" }
        const owner = json?.result;

        if (id === abortRef.current) {
          if (owner) {
            setData(owner);
          } else {
            setIsError(true);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (id === abortRef.current && !controller.signal.aborted) {
          setData(null);
          setIsError(true);
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, [name]);

  return { data, isLoading, isError };
}
