import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SOLANA_CONFIG } from "../config";
import { getEnv } from "../utils/env";
import { SolanaMinterClient } from "./minter";
import { SolanaWalletClient } from "./wallet";

export type SolanaAccount = {
  name: string;
  domain: number;
  currency: string;
  connection: Connection;
  keypair: Keypair;
  publicKey: PublicKey;
  address: string;
  usdc: { address: string; publicKey: PublicKey };
  gatewayWallet: SolanaWalletClient;
  gatewayMinter: SolanaMinterClient;
};

function keypairFromEnv(envName: string): Keypair | null {
  const raw = getEnv(envName);
  if (!raw) {
    return null;
  }
  const bytes = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(bytes);
}

function buildSolanaAccount(name: string, keypair: Keypair): SolanaAccount {
  const rpcUrl = SOLANA_CONFIG.defaultRpcUrl;
  const connection = new Connection(rpcUrl, "confirmed");
  const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);

  return {
    name,
    domain: SOLANA_CONFIG.domain,
    currency: SOLANA_CONFIG.currency,
    connection,
    keypair,
    publicKey: keypair.publicKey,
    address: keypair.publicKey.toBase58(),
    usdc: { address: SOLANA_CONFIG.usdcMint, publicKey: usdcMint },
    gatewayWallet: new SolanaWalletClient({
      connection,
      keypair,
      gatewayWalletAddress: SOLANA_CONFIG.gatewayWalletProgram,
    }),
    gatewayMinter: new SolanaMinterClient({
      connection,
      keypair,
      gatewayMinterAddress: SOLANA_CONFIG.gatewayMinterProgram,
    }),
  };
}

export function getSolanaAccount1(): SolanaAccount {
  const keypair = keypairFromEnv("SOLANA_PRIVATE_KEYPAIR");
  if (!keypair) {
    throw new Error("Missing SOLANA_PRIVATE_KEYPAIR in environment");
  }
  return buildSolanaAccount("solanaAccount1", keypair);
}

export function getSolanaAccount2(): SolanaAccount | null {
  const keypair = keypairFromEnv("SOLANA_PRIVATE_KEYPAIR_2");
  if (!keypair) {
    return null;
  }
  return buildSolanaAccount("solanaAccount2", keypair);
}
