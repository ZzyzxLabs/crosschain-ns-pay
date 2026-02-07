import { u32be, struct, blob, offset, Layout } from "@solana/buffer-layout";
import { publicKey } from "@solana/buffer-layout-utils";
import { PublicKey } from "@solana/web3.js";
import type { BurnIntent } from "../transfer/burn-intent";

const TRANSFER_SPEC_MAGIC = 0x1010202;
const BURN_INTENT_MAGIC = 0x1010101;

class UInt256BE extends Layout<bigint> {
  constructor(property?: string) {
    super(32, property);
  }

  override decode(buffer: Buffer, offsetValue = 0): bigint {
    const slice = buffer.slice(offsetValue, offsetValue + 32);
    return slice.readBigUInt64BE(24);
  }

  override encode(value: bigint, buffer: Buffer, offsetValue = 0): number {
    const temp = Buffer.alloc(32);
    temp.writeBigUInt64BE(BigInt(value), 24);
    temp.copy(buffer, offsetValue);
    return 32;
  }
}

const uint256be = (property?: string) => new UInt256BE(property);
const hexToPublicKey = (hex: string) => new PublicKey(Buffer.from(hex.slice(2), "hex"));

const BurnIntentLayout: any = (struct as any)([
  u32be("magic"),
  uint256be("maxBlockHeight"),
  uint256be("maxFee"),
  u32be("transferSpecLength"),
  struct(
    [
      u32be("magic"),
      u32be("version"),
      u32be("sourceDomain"),
      u32be("destinationDomain"),
      publicKey("sourceContract"),
      publicKey("destinationContract"),
      publicKey("sourceToken"),
      publicKey("destinationToken"),
      publicKey("sourceDepositor"),
      publicKey("destinationRecipient"),
      publicKey("sourceSigner"),
      publicKey("destinationCaller"),
      uint256be("value"),
      blob(32, "salt"),
      u32be("hookDataLength"),
      blob(offset(u32be(), -4), "hookData"),
    ],
    "spec"
  ),
]);

export function encodeBurnIntent(burnIntent: BurnIntent): Buffer {
  const hookData = Buffer.from((burnIntent.spec.hookData || "0x").slice(2), "hex");
  const prepared = {
    magic: BURN_INTENT_MAGIC,
    maxBlockHeight: burnIntent.maxBlockHeight,
    maxFee: burnIntent.maxFee,
    transferSpecLength: 340 + hookData.length,
    spec: {
      magic: TRANSFER_SPEC_MAGIC,
      version: Number(burnIntent.spec.version),
      sourceDomain: Number(burnIntent.spec.sourceDomain),
      destinationDomain: Number(burnIntent.spec.destinationDomain),
      sourceContract: hexToPublicKey(burnIntent.spec.sourceContract),
      destinationContract: hexToPublicKey(burnIntent.spec.destinationContract),
      sourceToken: hexToPublicKey(burnIntent.spec.sourceToken),
      destinationToken: hexToPublicKey(burnIntent.spec.destinationToken),
      sourceDepositor: hexToPublicKey(burnIntent.spec.sourceDepositor),
      destinationRecipient: hexToPublicKey(burnIntent.spec.destinationRecipient),
      sourceSigner: hexToPublicKey(burnIntent.spec.sourceSigner),
      destinationCaller: hexToPublicKey(burnIntent.spec.destinationCaller ?? "0x" + "00".repeat(32)),
      value: burnIntent.spec.value,
      salt: Buffer.from(burnIntent.spec.salt.slice(2), "hex"),
      hookDataLength: hookData.length,
      hookData,
    },
  };

  const buffer = Buffer.alloc(72 + 340 + hookData.length);
  const bytesWritten = BurnIntentLayout.encode(prepared, buffer);
  return buffer.subarray(0, bytesWritten);
}
