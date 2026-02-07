import crypto from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import type { BurnIntent } from "../transfer/burn-intent";
import { encodeBurnIntent } from "./burn-intent";
import { createAnchorProvider } from "./anchor-provider";
import { gatewayWalletIdl } from "./idl";

export class SolanaWalletClient {
  readonly gatewayWalletAddress: string;
  readonly account: Keypair;
  private readonly connection: Connection;
  private readonly program: Program;

  constructor(params: {
    connection: Connection;
    keypair: Keypair;
    gatewayWalletAddress: string;
  }) {
    this.connection = params.connection;
    this.account = params.keypair;
    this.gatewayWalletAddress = params.gatewayWalletAddress;

    const anchorProvider = createAnchorProvider(this.connection, this.account);

    this.program = new Program(
      gatewayWalletIdl as any,
      new PublicKey(this.gatewayWalletAddress),
      anchorProvider
    );
  }

  findCustodyPda(tokenMint: PublicKey) {
    const gatewayWalletProgramId = new PublicKey(this.gatewayWalletAddress);
    return PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("gateway_wallet_custody"), tokenMint.toBuffer()],
      gatewayWalletProgramId
    );
  }

  findDepositPda(tokenMint: PublicKey, depositor: PublicKey) {
    const gatewayWalletProgramId = new PublicKey(this.gatewayWalletAddress);
    return PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("gateway_deposit"),
        tokenMint.toBuffer(),
        depositor.toBuffer(),
      ],
      gatewayWalletProgramId
    );
  }

  findDenylistPda(address: PublicKey) {
    const gatewayWalletProgramId = new PublicKey(this.gatewayWalletAddress);
    return PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("denylist"), address.toBuffer()],
      gatewayWalletProgramId
    );
  }

  findGatewayWalletPda() {
    const gatewayWalletProgramId = new PublicKey(this.gatewayWalletAddress);
    return PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("gateway_wallet")],
      gatewayWalletProgramId
    );
  }

  findATA(tokenMint: PublicKey, owner: PublicKey) {
    return getAssociatedTokenAddressSync(tokenMint, owner);
  }

  async deposit(params: { amount: anchor.BN; tokenMint: PublicKey }): Promise<string> {
    const [gatewayWalletPda] = this.findGatewayWalletPda();
    const [custodyPda] = this.findCustodyPda(params.tokenMint);
    const [depositPda] = this.findDepositPda(params.tokenMint, this.account.publicKey);
    const [denylistPda] = this.findDenylistPda(this.account.publicKey);

    const ownerTokenAccount = this.findATA(params.tokenMint, this.account.publicKey);

    return (this.program.methods
      .deposit(params.amount) as any)
      .accountsPartial({
        payer: this.account.publicKey,
        owner: this.account.publicKey,
        gatewayWallet: gatewayWalletPda,
        ownerTokenAccount,
        custodyTokenAccount: custodyPda,
        deposit: depositPda,
        depositorDenylist: denylistPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.account])
      .rpc();
  }

  signBurnIntent(burnIntent: BurnIntent): string {
    const encodedBurnIntent = encodeBurnIntent(burnIntent);
    const prefix = Buffer.concat([Buffer.from([0xff]), Buffer.alloc(15)]);
    const prefixed = Buffer.concat([prefix, encodedBurnIntent]);

    const privateKeyDer = Buffer.concat([
      Buffer.from("302e020100300506032b657004220420", "hex"),
      this.account.secretKey.subarray(0, 32),
    ]);

    const privateKey = crypto.createPrivateKey({
      key: privateKeyDer,
      format: "der",
      type: "pkcs8",
    });

    const signature = crypto.sign(null, prefixed, privateKey).subarray(0, 64);
    return `0x${signature.toString("hex")}`;
  }

  async waitForConfirmation(signature: string): Promise<void> {
    await this.connection.confirmTransaction(signature, "confirmed");
  }
}
