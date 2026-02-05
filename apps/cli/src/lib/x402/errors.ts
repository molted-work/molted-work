/**
 * x402 Payment Error Classification Utilities
 *
 * Provides structured error classification and helpful error messages
 * for blockchain payment errors.
 */

import {
  PaymentError,
  type PaymentErrorCode,
  type PaymentErrorContext,
} from "../errors.js";
import { NETWORK_INFO } from "../wallet/types.js";

// Faucet URLs by chain ID
const FAUCETS: Record<number, { eth?: string; usdc?: string }> = {
  84532: {
    eth: "https://www.alchemy.com/faucets/base-sepolia",
    usdc: "https://faucet.circle.com/",
  },
};

// Minimum ETH required for gas (0.0001 ETH)
export const MIN_ETH_FOR_GAS = BigInt("100000000000000"); // 0.0001 ETH in wei

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  for (const [, info] of Object.entries(NETWORK_INFO)) {
    if (info.chainId === chainId) {
      return info.name;
    }
  }
  return `Chain ${chainId}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(chainId: number, txHash?: string): string | undefined {
  for (const [, info] of Object.entries(NETWORK_INFO)) {
    if (info.chainId === chainId) {
      return txHash ? `${info.explorer}/tx/${txHash}` : info.explorer;
    }
  }
  return undefined;
}

/**
 * Format ETH balance for display
 */
export function formatETHBalance(weiBalance: bigint): string {
  const eth = Number(weiBalance) / 1e18;
  return eth.toFixed(6);
}

/**
 * Classify a blockchain error by examining error message patterns
 */
export function classifyPaymentError(
  error: Error,
  chainId: number
): PaymentError {
  const message = error.message.toLowerCase();

  // Insufficient ETH for gas
  if (
    message.includes("insufficient funds") ||
    message.includes("gas required exceeds") ||
    message.includes("insufficient balance for gas")
  ) {
    return createInsufficientETHError("0", chainId);
  }

  // Insufficient USDC balance
  if (
    message.includes("transfer amount exceeds balance") ||
    message.includes("erc20: transfer amount exceeds balance")
  ) {
    return createInsufficientUSDCError(undefined, undefined, chainId);
  }

  // Transaction reverted
  if (
    message.includes("reverted") ||
    message.includes("execution reverted") ||
    message.includes("transaction failed")
  ) {
    return new PaymentError(`Transaction reverted: ${error.message}`, {
      code: "TX_REVERTED",
      network: getNetworkName(chainId),
      chainId,
      nextStep: "Check the transaction details and try again",
    });
  }

  // RPC/Network errors
  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("econnrefused") ||
    message.includes("failed to fetch")
  ) {
    return new PaymentError(`Network error: ${error.message}`, {
      code: "RPC_ERROR",
      network: getNetworkName(chainId),
      chainId,
      nextStep: "Check your network connection and try again",
    });
  }

  // Unknown error - wrap with chain context
  return new PaymentError(`Payment failed: ${error.message}`, {
    code: "TX_REVERTED",
    network: getNetworkName(chainId),
    chainId,
  });
}

/**
 * Create an error for chain ID mismatch
 */
export function createChainMismatchError(
  walletChainId: number,
  requiredChainId: number
): PaymentError {
  const walletNetwork = getNetworkName(walletChainId);
  const requiredNetwork = getNetworkName(requiredChainId);

  return new PaymentError(
    `Chain mismatch: wallet is on ${walletNetwork}, but payment requires ${requiredNetwork}`,
    {
      code: "CHAIN_MISMATCH",
      chainId: walletChainId,
      expectedChainId: requiredChainId,
      network: requiredNetwork,
      nextStep: `Run 'molted init' to reconfigure for ${requiredNetwork}`,
    }
  );
}

/**
 * Create an error for insufficient ETH (for gas)
 */
export function createInsufficientETHError(
  available: string,
  chainId: number
): PaymentError {
  const network = getNetworkName(chainId);
  const faucet = FAUCETS[chainId]?.eth;
  const nextStep = faucet
    ? `Get testnet ETH from: ${faucet}`
    : "Add ETH to your wallet for gas fees";

  return new PaymentError(
    `Insufficient ETH for gas fees. Available: ${available} ETH`,
    {
      code: "INSUFFICIENT_ETH",
      available: `${available} ETH`,
      required: "~0.0001 ETH (for gas)",
      network,
      chainId,
      nextStep,
    }
  );
}

/**
 * Create an error for insufficient USDC
 */
export function createInsufficientUSDCError(
  required: string | undefined,
  available: string | undefined,
  chainId: number
): PaymentError {
  const network = getNetworkName(chainId);
  const faucet = FAUCETS[chainId]?.usdc;
  const nextStep = faucet
    ? `Get testnet USDC from: ${faucet}`
    : "Add USDC to your wallet";

  const message =
    required && available
      ? `Insufficient USDC balance. Need ${required} USDC, have ${available} USDC`
      : "Insufficient USDC balance for this payment";

  return new PaymentError(message, {
    code: "INSUFFICIENT_USDC",
    required: required ? `${required} USDC` : undefined,
    available: available ? `${available} USDC` : undefined,
    network,
    chainId,
    nextStep,
  });
}

/**
 * Create an error for already-paid jobs
 */
export function createAlreadyPaidError(
  txHash?: string,
  chainId?: number
): PaymentError {
  const explorerUrl =
    txHash && chainId ? getExplorerUrl(chainId, txHash) : undefined;

  return new PaymentError("This job has already been paid", {
    code: "ALREADY_PAID",
    txHash,
    nextStep: explorerUrl
      ? `View transaction: ${explorerUrl}`
      : txHash
        ? `Transaction hash: ${txHash}`
        : undefined,
  });
}
