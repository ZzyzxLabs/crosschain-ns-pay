import { transformBurnIntent, type BurnIntent } from "../transfer/burn-intent";

const domain = {
  name: "GatewayWallet",
  version: "1",
};

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

export function burnIntentTypedData(
  intent: BurnIntent,
  isSourceSolana = false,
  isDestinationSolana = false
) {
  return {
    types: {
      EIP712Domain,
      TransferSpec,
      BurnIntent: BurnIntentType,
    },
    domain,
    primaryType: "BurnIntent" as const,
    message: transformBurnIntent(intent, isSourceSolana, isDestinationSolana),
  };
}
