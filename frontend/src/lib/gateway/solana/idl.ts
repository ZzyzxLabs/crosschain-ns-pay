export const gatewayWalletIdl = {
  address: "devN7ZZFhGVTgwoKHaDDTFFgrhRzSGzuC6hgVFPrxbs",
  metadata: {
    name: "gateway_wallet",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "config", pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] } },
        { name: "signer", signer: true },
        { name: "systemProgram", address: "11111111111111111111111111111111" },
      ],
      args: [],
    },
    {
      name: "deposit",
      accounts: [
        { name: "config", pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] } },
        { name: "sender" },
        { name: "senderTokenAccount" },
        { name: "custodyTokenAccount" },
        { name: "tokenProgram" },
      ],
      args: [{ name: "amount", type: "u64" }],
    },
  ],
} as const;

export const gatewayMinterIdl = {
  address: "dev7nrwXTbNi8qnjVc7cUwH45NE1HDcgheKmmdvbqsEB",
  metadata: {
    name: "gateway_minter",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "gatewayMint",
      accounts: [
        { name: "config", pda: { seeds: [{ kind: "const", value: [99, 111, 110, 102, 105, 103] }] } },
        { name: "mint" },
        { name: "recipient" },
        { name: "recipientTokenAccount" },
        { name: "solanaMessage" },
        { name: "tokenMessengerMinterProgram" },
        { name: "tokenMessenger" },
        { name: "tokenMinter" },
        { name: "localToken" },
        { name: "tokenPair" },
        { name: "remoteTokenMessenger" },
        { name: "tokenMessengerMinterProgramEventAuthority" },
        { name: "tokenMessengerMinterProgramCpi" },
        { name: "tokenMessengerMinterProgramCpiEventAuthority" },
        { name: "tokenProgram" },
        { name: "systemProgram" },
        { name: "custodyTokenAccount" },
      ],
      args: [
        { name: "attestation", type: "bytes" },
        { name: "signature", type: "bytes" },
      ],
    },
  ],
} as const;
