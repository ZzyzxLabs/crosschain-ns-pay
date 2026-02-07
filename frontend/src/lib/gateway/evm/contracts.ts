export const gatewayWalletAbi = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "depositForBurn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "token", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "domains",
    stateMutability: "view",
    inputs: [
      { name: "domain", type: "uint32" },
    ],
    outputs: [
      { name: "", type: "bool" },
    ],
  },
] as const;

export const gatewayMinterAbi = [
  {
    type: "function",
    name: "gatewayMint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "attestation", type: "bytes" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;
