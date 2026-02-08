import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  getContract,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EVM_CHAIN_CONFIG, type EvmChainName } from "../config";
import { getEnv } from "../utils/env";
import { gatewayMinterAbi, gatewayWalletAbi } from "./contracts";
import { EVM_GATEWAY_WALLET, EVM_GATEWAY_MINTER } from "../config";

export type EvmContract = {
  address: `0x${string}`;
  read: Record<string, (...args: any[]) => Promise<any>>;
  write: Record<string, (...args: any[]) => Promise<any>>;
};

export type EvmChainClient = {
  name: EvmChainName;
  domain: number;
  currency: string;
  chain: (typeof EVM_CHAIN_CONFIG)[EvmChainName]["chain"];
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  usdc: EvmContract;
  gatewayWallet: EvmContract;
  gatewayMinter: EvmContract;
};

const chainCache = new Map<EvmChainName, EvmChainClient>();

function normalizePrivateKey(raw: string): `0x${string}` {
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
}

export function getEvmAccount() {
  const raw = getEnv("EVM_PRIVATE_KEY") ?? getEnv("PRIVATE_KEY");
  if (!raw) {
    throw new Error("Missing EVM_PRIVATE_KEY (or PRIVATE_KEY) in environment");
  }
  return privateKeyToAccount(normalizePrivateKey(raw));
}

export function getEvmChain(name: EvmChainName): EvmChainClient {
  const cached = chainCache.get(name);
  if (cached) {
    return cached;
  }

  const config = EVM_CHAIN_CONFIG[name];
  const rpcUrl = config.chain.rpcUrls.default.http[0];

  const account = getEvmAccount();
  const transport = http(rpcUrl);
  const publicClient = createPublicClient({
    chain: config.chain,
    transport,
  });
  const walletClient = createWalletClient({
    account,
    chain: config.chain,
    transport,
  });

  const contractClient = { public: publicClient, wallet: walletClient };

  const usdc = getContract({
    address: config.usdc,
    abi: erc20Abi,
    client: contractClient,
  }) as unknown as EvmContract;
  const gatewayWallet = getContract({
    address: EVM_GATEWAY_WALLET,
    abi: gatewayWalletAbi,
    client: contractClient,
  }) as unknown as EvmContract;
  const gatewayMinter = getContract({
    address: EVM_GATEWAY_MINTER,
    abi: gatewayMinterAbi,
    client: contractClient,
  }) as unknown as EvmContract;

  const chainClient: EvmChainClient = {
    name,
    domain: config.domainId,
    currency: config.currency,
    chain: config.chain,
    publicClient,
    walletClient,
    usdc,
    gatewayWallet,
    gatewayMinter,
  };

  chainCache.set(name, chainClient);
  return chainClient;
}
