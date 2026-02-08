import { randomBytes } from "node:crypto";
import bs58 from "bs58";
import { pad } from "viem";
import {
  EVM_CHAIN_CONFIG,
  EVM_GATEWAY_WALLET,
  SOLANA_CONFIG,
  type EvmChainName,
} from "../config";
import { parseUsdcToBigInt } from "../utils/amounts";
import type { BurnIntent, BurnIntentSpec } from "./burn-intent";
import { SOLANA_ZERO_ADDRESS } from "./burn-intent";

const MAX_U64 = 2n ** 64n - 1n;
const DEFAULT_MAX_FEE = 2_010000n;

/** Pad EVM address to 32 bytes (0x-prefixed hex). */
export function evmAddressToBytes32(address: string): string {
  return pad(address.toLowerCase() as `0x${string}`, { size: 32 });
}

/** Convert Solana address (base58) to 32-byte hex string. */
export function solanaAddressToBytes32(address: string): string {
  const decoded = bs58.decode(address);
  return `0x${Buffer.from(decoded).toString("hex")}`;
}

/** Serialize object to JSON with BigInt converted to string. */
export function stringifyTypedData(obj: unknown): string {
  return JSON.stringify(obj, (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

/** Create burn intent for EVM → Solana transfer (destination addresses as bytes32). */
export function createBurnIntentEvmToSolana(params: {
  sourceChain: EvmChainName;
  depositorAddress: string;
  recipientAddress: string;
  amount: string;
}): BurnIntent {
  const { sourceChain, depositorAddress, recipientAddress, amount } = params;
  const sourceConfig = EVM_CHAIN_CONFIG[sourceChain];
  const value = parseUsdcToBigInt(amount);

  const spec: BurnIntentSpec = {
    version: 1n,
    sourceDomain: BigInt(sourceConfig.domainId),
    destinationDomain: BigInt(SOLANA_CONFIG.domainId),
    sourceContract: EVM_GATEWAY_WALLET,
    destinationContract: solanaAddressToBytes32(
      SOLANA_CONFIG.gatewayMinterProgram,
    ),
    sourceToken: sourceConfig.usdc,
    destinationToken: solanaAddressToBytes32(SOLANA_CONFIG.usdcMint),
    sourceDepositor: depositorAddress,
    destinationRecipient: solanaAddressToBytes32(recipientAddress),
    sourceSigner: depositorAddress,
    destinationCaller: solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
    value,
    salt: `0x${randomBytes(32).toString("hex")}`,
    hookData: "0x",
  };

  return {
    maxBlockHeight: MAX_U64,
    maxFee: DEFAULT_MAX_FEE,
    spec,
  };
}

/** Format burn intent as EIP-712 typed data for signing (EVM source addresses → bytes32). */
export function burnIntentTypedDataForEvmToSolana(intent: BurnIntent): {
  types: Record<string, unknown[]>;
  domain: { name: string; version: string };
  primaryType: "BurnIntent";
  message: BurnIntent;
} {
  const EIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
  ];
  const TransferSpec = [
    { name: "version", type: "uint32" },
    { name: "sourceDomain", type: "uint32" },
    { name: "destinationDomain", type: "uint32" },
    { name: "sourceContract", type: "bytes32" },
    { name: "destinationContract", type: "bytes32" },
    { name: "sourceToken", type: "bytes32" },
    { name: "destinationToken", type: "bytes32" },
    { name: "sourceDepositor", type: "bytes32" },
    { name: "destinationRecipient", type: "bytes32" },
    { name: "sourceSigner", type: "bytes32" },
    { name: "destinationCaller", type: "bytes32" },
    { name: "value", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "hookData", type: "bytes" },
  ];
  const BurnIntentType = [
    { name: "maxBlockHeight", type: "uint256" },
    { name: "maxFee", type: "uint256" },
    { name: "spec", type: "TransferSpec" },
  ];

  const spec: BurnIntentSpec = {
    ...intent.spec,
    sourceContract: evmAddressToBytes32(intent.spec.sourceContract),
    destinationContract: intent.spec.destinationContract,
    sourceToken: evmAddressToBytes32(intent.spec.sourceToken),
    destinationToken: intent.spec.destinationToken,
    sourceDepositor: evmAddressToBytes32(intent.spec.sourceDepositor),
    destinationRecipient: intent.spec.destinationRecipient,
    sourceSigner: evmAddressToBytes32(intent.spec.sourceSigner),
    destinationCaller:
      intent.spec.destinationCaller ??
      solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
  };

  return {
    types: {
      EIP712Domain,
      TransferSpec,
      BurnIntent: BurnIntentType,
    },
    domain: { name: "GatewayWallet", version: "1" },
    primaryType: "BurnIntent",
    message: {
      maxBlockHeight: intent.maxBlockHeight,
      maxFee: intent.maxFee,
      spec,
    },
  };
}

/** Convert EVM→Solana intent to API shape (all addresses as bytes32). */
export function transformBurnIntentForApiEvmToSolana(
  intent: BurnIntent,
): BurnIntent {
  return {
    ...intent,
    spec: {
      ...intent.spec,
      sourceContract: evmAddressToBytes32(intent.spec.sourceContract),
      sourceToken: evmAddressToBytes32(intent.spec.sourceToken),
      sourceDepositor: evmAddressToBytes32(intent.spec.sourceDepositor),
      sourceSigner: evmAddressToBytes32(intent.spec.sourceSigner),
      destinationCaller:
        intent.spec.destinationCaller ??
        solanaAddressToBytes32(SOLANA_ZERO_ADDRESS),
    },
  };
}
