import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { decodeAttestationSet } from "./attestation";
import { createAnchorProvider } from "./anchor-provider";
import { gatewayMinterIdl } from "./idl";

export class SolanaMinterClient {
  readonly gatewayMinterAddress: string;
  readonly account: Keypair;
  private readonly connection: Connection;
  private readonly program: Program;

  constructor(params: {
    connection: Connection;
    keypair: Keypair;
    gatewayMinterAddress: string;
  }) {
    this.connection = params.connection;
    this.account = params.keypair;
    this.gatewayMinterAddress = params.gatewayMinterAddress;

    const anchorProvider = createAnchorProvider(this.connection, this.account);

    this.program = new Program(
      gatewayMinterIdl as any,
      new PublicKey(this.gatewayMinterAddress),
      anchorProvider
    );
  }

  findCustodyPda(tokenMint: PublicKey): PublicKey {
    const gatewayMinterProgramId = new PublicKey(this.gatewayMinterAddress);
    const [pda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("gateway_minter_custody"), tokenMint.toBuffer()],
      gatewayMinterProgramId
    );
    return pda;
  }

  findTransferSpecHashPda(transferSpecHash: Buffer): PublicKey {
    const gatewayMinterProgramId = new PublicKey(this.gatewayMinterAddress);
    const [pda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("used_transfer_spec_hash"), transferSpecHash],
      gatewayMinterProgramId
    );
    return pda;
  }

  findGatewayMinterPda(): PublicKey {
    const gatewayMinterProgramId = new PublicKey(this.gatewayMinterAddress);
    const [pda] = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("gateway_minter")],
      gatewayMinterProgramId
    );
    return pda;
  }

  findEventAuthorityPda(): PublicKey {
    const programId = new PublicKey(this.gatewayMinterAddress);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("__event_authority")],
      programId
    );
    return pda;
  }

  async gatewayMint(params: {
    attestation: string;
    signature: string;
    usdcToken: PublicKey;
  }): Promise<string> {
    const decoded = decodeAttestationSet(params.attestation);
    const attestationItem = decoded.attestations[0];
    const transferSpecHash = attestationItem.transferSpecHash;
    const destinationRecipient = new PublicKey(attestationItem.destinationRecipient.toBase58());

    const gatewayMinterPda = this.findGatewayMinterPda();
    const custodyPda = this.findCustodyPda(params.usdcToken);
    const transferSpecHashPda = this.findTransferSpecHashPda(transferSpecHash);

    const attestationBytes = Buffer.from(params.attestation.slice(2), "hex");
    const signatureBytes = Buffer.from(params.signature.slice(2), "hex");
    const eventAuthority = this.findEventAuthorityPda();
    const programId = new PublicKey(this.gatewayMinterAddress);

    return (this.program.methods
      .gatewayMint({ attestation: attestationBytes, signature: signatureBytes }) as any)
      .accounts({
        payer: this.account.publicKey,
        gatewayMinter: gatewayMinterPda,
        destinationCaller: this.account.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        eventAuthority,
        program: programId,
      })
      .remainingAccounts([
        { pubkey: custodyPda, isSigner: false, isWritable: true },
        { pubkey: destinationRecipient, isSigner: false, isWritable: true },
        { pubkey: transferSpecHashPda, isSigner: false, isWritable: true },
      ])
      .signers([this.account])
      .rpc();
  }

  async waitForConfirmation(signature: string): Promise<void> {
    await this.connection.confirmTransaction(signature, "confirmed");
  }
}
