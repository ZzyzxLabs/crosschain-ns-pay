import { randomBytes } from "node:crypto";
import bs58 from "bs58";
import { pad, toHex, zeroAddress } from "viem";
import { parseUsdcToBigInt } from "../utils/amounts";

const MAX_U64 = 2n ** 64n - 1n;
export const SOLANA_ZERO_ADDRESS = "11111111111111111111111111111111";
const DEFAULT_MAX_FEE = 2_010000n;

export type BurnIntentSpec = {
  version: bigint;
  sourceDomain: bigint;
  destinationDomain: bigint;
  sourceContract: string;
  destinationContract: string;
  sourceToken: string;
  destinationToken: string;
  sourceDepositor: string;
  destinationRecipient: string;
  sourceSigner: string;
  destinationCaller?: string;
  value: bigint;
  salt: string;
  hookData: string;
};

export type BurnIntent = {
  maxBlockHeight: bigint;
  maxFee: bigint;
  spec: BurnIntentSpec;
};

export type ChainRefs = {
  domain: number;
  gatewayWallet: { address: string };
  gatewayMinter: { address: string };
  usdc: { address: string };
};

export type AccountRef = { address: string };

export function burnIntent(params: {
  account: AccountRef;
  from: ChainRefs;
  to: ChainRefs;
  amount: string;
  recipient: string;
  destinationCaller?: string;
}): BurnIntent {
  const value = parseUsdcToBigInt(params.amount);

  return {
    maxBlockHeight: MAX_U64,
    maxFee: DEFAULT_MAX_FEE,
    spec: {
      version: 1n,
      sourceDomain: BigInt(params.from.domain),
      destinationDomain: BigInt(params.to.domain),
      sourceContract: params.from.gatewayWallet.address,
      destinationContract: params.to.gatewayMinter.address,
      sourceToken: params.from.usdc.address,
      destinationToken: params.to.usdc.address,
      sourceDepositor: params.account.address,
      destinationRecipient: params.recipient,
      sourceSigner: params.account.address,
      destinationCaller: params.destinationCaller,
      value,
      salt: `0x${randomBytes(32).toString("hex")}`,
      hookData: "0x",
    },
  };
}

function addressToBytes32(address: string, isSolana: boolean): string {
  if (isSolana) {
    const bytes = bs58.decode(address);
    if (bytes.length !== 32) {
      throw new Error(`Invalid Solana public key length for ${address}`);
    }
    return toHex(bytes);
  }
  return pad(address.toLowerCase() as `0x${string}`, { size: 32 });
}

export function transformBurnIntent(
  intent: BurnIntent,
  isSourceSolana: boolean,
  isDestinationSolana: boolean
): BurnIntent {
  const destinationCallerValue = isDestinationSolana
    ? intent.spec.destinationCaller ?? SOLANA_ZERO_ADDRESS
    : intent.spec.destinationCaller ?? zeroAddress;

  return {
    ...intent,
    spec: {
      ...intent.spec,
      sourceContract: addressToBytes32(intent.spec.sourceContract, isSourceSolana),
      destinationContract: addressToBytes32(intent.spec.destinationContract, isDestinationSolana),
      sourceToken: addressToBytes32(intent.spec.sourceToken, isSourceSolana),
      destinationToken: addressToBytes32(intent.spec.destinationToken, isDestinationSolana),
      sourceDepositor: addressToBytes32(intent.spec.sourceDepositor, isSourceSolana),
      destinationRecipient: addressToBytes32(intent.spec.destinationRecipient, isDestinationSolana),
      sourceSigner: addressToBytes32(intent.spec.sourceSigner, isSourceSolana),
      destinationCaller: addressToBytes32(destinationCallerValue, isDestinationSolana),
    },
  };
}
