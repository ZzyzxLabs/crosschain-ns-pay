import type { Chain } from "viem/chains";
import type { Address } from "viem";
import { arcTestnet, avalancheFuji, baseSepolia, sepolia } from "viem/chains";

/** Shared Gateway testnet contract addresses (same across EVM testnets). */
export const EVM_GATEWAY_WALLET: Address =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
export const EVM_GATEWAY_MINTER: Address =
  "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";
export const SOLANA_GATEWAY_WALLET =
  "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu";
export const SOLANA_GATEWAY_MINTER =
  "GATEmKK2ECL1brEngQZWCgMWPbvrEYqsV6u29dAaHavr";

export type EvmChainConfig = {
  chain: Chain;
  domainId: number;
  usdc: Address;
  defaultRpcUrl?: string;
  currency: string;
};

/** Single source of truth: all supported EVM chains (imported from viem). */
export const EVM_CHAIN_CONFIG = {
  sepolia: {
    chain: sepolia,
    domainId: 0,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as Address,
    currency: "ETH",
  },
  baseSepolia: {
    chain: baseSepolia,
    domainId: 6,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
    defaultRpcUrl: "https://sepolia-preconf.base.org",
    currency: "ETH",
  },
  avalancheFuji: {
    chain: avalancheFuji,
    domainId: 1,
    usdc: "0x5425890298aed601595a70AB815c96711a31Bc65" as Address,
    defaultRpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    currency: "AVAX",
  },
  arcTestnet: {
    chain: arcTestnet,
    domainId: 26,
    usdc: "0x3600000000000000000000000000000000000000" as Address,
    currency: "USDC",
  },
} as const satisfies Record<string, EvmChainConfig>;

export const EVM_DOMAIN_IDS = Object.values(EVM_CHAIN_CONFIG).map(
  (c) => c.domainId,
);
export const SOLANA_DOMAIN_ID = 5;

export type EvmChainName = keyof typeof EVM_CHAIN_CONFIG;

/** Supported EVM chains in display order (derived from config). */
export const SUPPORTED_EVM_CHAIN_NAMES: readonly EvmChainName[] = Object.keys(
  EVM_CHAIN_CONFIG,
) as EvmChainName[];

export type SolanaChainName = "solanaDevnet";

/** All chains that can be selected as transfer destination (EVM + Solana devnet). */
export const SUPPORTED_TRANSFER_TO_CHAIN_NAMES: readonly (
  | EvmChainName
  | SolanaChainName
)[] = [...SUPPORTED_EVM_CHAIN_NAMES, "solanaDevnet"];

export type TransferToChainName =
  (typeof SUPPORTED_TRANSFER_TO_CHAIN_NAMES)[number];

/** Solana devnet config (single supported Solana chain). */
export const SOLANA_CONFIG = {
  domainId: 5,
  defaultRpcUrl: "https://api.devnet.solana.com",
  usdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  gatewayWalletProgram: "GATEwdfmYNELfp5wDmmR6noSr2vHnAfBPMm2PvCzX5vu",
  gatewayMinterProgram: "GATEmKK2ECL1brEngQZWCgMWPbvrEYqsV6u29dAaHavr",
  currency: "SOL",
} as const;

/** Display label for UI (testnet/devnet names). */
export function getChainDisplayName(
  name: EvmChainName | SolanaChainName,
): string {
  if (name === "solanaDevnet") return "Solana Devnet";
  return EVM_CHAIN_CONFIG[name].chain.name;
}
