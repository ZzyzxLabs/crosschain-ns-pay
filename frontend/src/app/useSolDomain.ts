"use client";

import { useEffect, useRef, useState } from "react";
import { Connection } from "@solana/web3.js";
import { getDomainKey, NameRegistryState } from "@bonfida/spl-name-service";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

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

    (async () => {
      try {
        const connection = new Connection(SOLANA_RPC);
        // Strip the .sol suffix — getDomainKey expects just the name part
        const domain = name.endsWith(".sol") ? name.slice(0, -4) : name;
        const { pubkey } = await getDomainKey(domain);
        const { registry } = await NameRegistryState.retrieve(
          connection,
          pubkey
        );
        const owner = registry.owner.toBase58();
        if (id === abortRef.current) {
          setData(owner);
          setIsLoading(false);
        }
      } catch {
        if (id === abortRef.current) {
          setData(null);
          setIsError(true);
          setIsLoading(false);
        }
      }
    })();
  }, [name]);

  return { data, isLoading, isError };
}
