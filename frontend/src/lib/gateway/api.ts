import { getEnv } from "./utils/env";
import { EVM_DOMAIN_IDS, SOLANA_DOMAIN_ID } from "./config";

function isEvmAddress(depositor: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(depositor.trim());
}

export const GATEWAY_CHAINS: Record<number, string> = {
  0: "Sepolia",
  1: "Avalanche Fuji",
  5: "Solana Devnet",
  6: "Base Sepolia",
  26: "Arc Testnet",
};

export type GatewayBalance = {
  domain: number;
  balance: string;
  token?: string;
};

export class GatewayClient {
  static BASE_URL =
    getEnv("GATEWAY_API_BASE_URL") ??
    "https://gateway-api-testnet.circle.com/v1";

  async info(): Promise<unknown> {
    return this.get("/info");
  }

  /**
   * Fetch USDC balances for a depositor.
   * If address is EVM (0x...), requests all EVM domains. If Solana (base58), requests domain 5 only.
   */
  async balances(depositor: string): Promise<GatewayBalance[]> {
    const domains = isEvmAddress(depositor)
      ? EVM_DOMAIN_IDS
      : [SOLANA_DOMAIN_ID];
    const body = {
      token: "USDC",
      sources: domains.map((domain) => ({ domain, depositor })),
    };
    const data = await this.post("/balances", body);
    return (data as { balances: GatewayBalance[] }).balances;
  }

  async transfer(
    request: Array<{ burnIntent: unknown; signature: string }>,
  ): Promise<{
    attestation: string;
    signature: string;
  }> {
    return this.post("/transfer", { burnIntentSet: request });
  }

  private async get(path: string): Promise<unknown> {
    const res = await fetch(`${GatewayClient.BASE_URL}${path}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gateway API GET ${path} failed: ${res.status} ${body}`);
    }
    return res.json();
  }

  private async post(path: string, body: unknown): Promise<any> {
    const res = await fetch(`${GatewayClient.BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gateway API POST ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  }
}
