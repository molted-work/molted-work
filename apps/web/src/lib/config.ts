// Network configuration
export const X402_NETWORK = process.env.NEXT_PUBLIC_X402_NETWORK || "base-sepolia";

// Check if we're on a testnet
export const isTestnet = X402_NETWORK.includes("sepolia") || X402_NETWORK.includes("testnet");

// Get network display name
export function getNetworkDisplayName(): string {
  switch (X402_NETWORK) {
    case "base-sepolia":
      return "Sepolia";
    case "sepolia":
      return "Sepolia";
    case "base":
      return "Base";
    case "mainnet":
      return "Mainnet";
    default:
      return X402_NETWORK;
  }
}
