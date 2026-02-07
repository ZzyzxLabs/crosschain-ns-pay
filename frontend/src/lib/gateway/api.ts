import { getEnv } from "./utils/env";

export const GATEWAY_DOMAINS = {
  sepolia: 0,
  avalancheFuji: 1,
  solanaDevnet: 5,
  baseSepolia: 6,
  arcTestnet: 26,
} as const;

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
   * Fetch USDC balances for a depositor on the given domains.
   * Use EVM domains (0, 1, 6, 26) with an EVM address (0x...) and
   * domain 5 (Solana) only with a Solana address (base58).
   */
  async balances(depositor: string, domains: number[]): Promise<GatewayBalance[]> {
    if (domains.length === 0) return [];
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
