import type { Chain } from "viem/chains";
import { arcTestnet, avalancheFuji, baseSepolia, sepolia } from "viem/chains";
import { GATEWAY_DOMAINS } from "./api";

export type EvmChainName =
  | "sepolia"
  | "baseSepolia"
  | "avalancheFuji"
  | "arcTestnet";
export type SolanaChainName = "solanaDevnet";

/** Single source of truth: EVM chains supported for deposit and transfer. */
export const SUPPORTED_EVM_CHAIN_NAMES: readonly EvmChainName[] = [
  "sepolia",
  "baseSepolia",
  "avalancheFuji",
  "arcTestnet",
];

/** All chains that can be selected as transfer destination (EVM + Solana). */
export const SUPPORTED_TRANSFER_TO_CHAIN_NAMES: readonly (
  | EvmChainName
  | SolanaChainName
)[] = [...SUPPORTED_EVM_CHAIN_NAMES, "solanaDevnet"];

export type TransferToChainName = (typeof SUPPORTED_TRANSFER_TO_CHAIN_NAMES)[number];

const SOLANA_DISPLAY_NAME = "Solana Devnet";

/** Display label for UI (testnet/devnet names). */
export function getChainDisplayName(
  name: EvmChainName | SolanaChainName,
): string {
  if (name === "solanaDevnet") return SOLANA_DISPLAY_NAME;
  return EVM_CHAIN_CONFIG[name].chain.name;
}

export const EVM_CHAIN_CONFIG: Record<
  EvmChainName,
  {
    chain: Chain;
    domain: number;
    usdc: `0x${string}`;
    gatewayWallet: `0x${string}`;
    gatewayMinter: `0x${string}`;
    defaultRpcUrl?: string;
    currency: string;
    rpcEnv: string;
  }
> = {
  sepolia: {
    chain: sepolia,
    domain: GATEWAY_DOMAINS.sepolia,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    currency: "ETH",
    rpcEnv: "RPC_SEPOLIA",
  },
  baseSepolia: {
    chain: baseSepolia,
    domain: GATEWAY_DOMAINS.baseSepolia,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    defaultRpcUrl: "https://sepolia-preconf.base.org",
    currency: "ETH",
    rpcEnv: "RPC_BASE_SEPOLIA",
  },
  avalancheFuji: {
    chain: avalancheFuji,
    domain: GATEWAY_DOMAINS.avalancheFuji,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65",
    gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    defaultRpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    currency: "AVAX",
    rpcEnv: "RPC_AVALANCHE_FUJI",
  },
  arcTestnet: {
    chain: arcTestnet,
    domain: GATEWAY_DOMAINS.arcTestnet,
    usdc: "0x3600000000000000000000000000000000000000",
    gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
    gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    currency: "USDC",
    rpcEnv: "RPC_ARC_TESTNET",
  },
};

export const SOLANA_CONFIG = {
  domain: GATEWAY_DOMAINS.solanaDevnet,
  rpcEnv: "RPC_SOLANA_DEVNET",
  defaultRpcUrl: "https://api.devnet.solana.com",
  usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  gatewayWalletProgram: "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu",
  gatewayMinterProgram: "GATEmKK2ECL1brEngQZWCgMWPbvrEYqsV6u29dAaHavr",
  currency: "SOL",
};
