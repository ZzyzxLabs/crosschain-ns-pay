import { SOLANA_CONFIG } from "../config";

/* Gateway Wallet IDL (for deposits) */
export const gatewayWalletIdl = {
  address: SOLANA_CONFIG.gatewayWalletProgram,
  metadata: {
    name: "gatewayWallet",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "deposit",
      discriminator: [22, 0],
      accounts: [
        { name: "payer", writable: true, signer: true },
        { name: "owner", signer: true },
        { name: "gatewayWallet" },
        { name: "ownerTokenAccount", writable: true },
        { name: "custodyTokenAccount", writable: true },
        { name: "deposit", writable: true },
        { name: "depositorDenylist" },
        { name: "tokenProgram" },
        { name: "systemProgram" },
        { name: "eventAuthority" },
        { name: "program" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
};

/* Gateway Minter IDL (for transfers) */
export const gatewayMinterIdl = {
  address: SOLANA_CONFIG.gatewayMinterProgram,
  metadata: { name: "gatewayMinter", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "gatewayMint",
      discriminator: [12, 0],
      accounts: [
        { name: "payer", isMut: true, isSigner: true },
        { name: "destinationCaller", isMut: false, isSigner: true },
        { name: "gatewayMinter", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "eventAuthority", isMut: false, isSigner: false },
        { name: "program", isMut: false, isSigner: false },
      ],
      args: [{ name: "params", type: { defined: "gatewayMintParams" } }],
    },
  ],
  types: [
    {
      name: "gatewayMintParams",
      type: {
        kind: "struct",
        fields: [
          { name: "attestation", type: "bytes" },
          { name: "signature", type: "bytes" },
        ],
      },
    },
  ],
};
