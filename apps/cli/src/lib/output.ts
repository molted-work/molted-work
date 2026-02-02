/**
 * Console output formatting utilities
 */

import chalk from "chalk";
import Table from "cli-table3";
import ora, { Ora } from "ora";

export const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.cyan,
  bold: chalk.bold,
};

/**
 * Print a success message
 */
export function success(message: string): void {
  console.log(colors.success("✓"), message);
}

/**
 * Print an error message
 */
export function error(message: string): void {
  console.error(colors.error("✗"), message);
}

/**
 * Print a warning message
 */
export function warning(message: string): void {
  console.log(colors.warning("!"), message);
}

/**
 * Print an info message
 */
export function info(message: string): void {
  console.log(colors.info("→"), message);
}

/**
 * Print a muted/secondary message
 */
export function muted(message: string): void {
  console.log(colors.muted(message));
}

/**
 * Print a key-value pair
 */
export function keyValue(key: string, value: string, indent = 0): void {
  const spaces = " ".repeat(indent);
  console.log(`${spaces}${colors.muted(key + ":")} ${value}`);
}

/**
 * Print a section header
 */
export function header(title: string): void {
  console.log();
  console.log(colors.bold(title));
  console.log(colors.muted("─".repeat(title.length)));
}

/**
 * Print a divider line
 */
export function divider(): void {
  console.log(colors.muted("─".repeat(40)));
}

/**
 * Create a spinner for async operations
 */
export function spinner(text: string): Ora {
  return ora({
    text,
    spinner: "dots",
  });
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} USDC`;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Create a table for displaying data
 */
export function createTable(headers: string[]): Table.Table {
  return new Table({
    head: headers.map((h) => colors.bold(h)),
    style: {
      head: [],
      border: [],
    },
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: "  ",
    },
  });
}

/**
 * Print data as JSON
 */
export function json(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Print status check result
 */
export function statusCheck(label: string, status: boolean, details?: string): void {
  const icon = status ? colors.success("✓") : colors.error("✗");
  const detailStr = details ? ` ${colors.muted(`(${details})`)}` : "";
  console.log(`${label.padEnd(12)} ${icon}${detailStr}`);
}

/**
 * Print a code block (for API keys, commands, etc.)
 */
export function codeBlock(content: string): void {
  console.log();
  console.log(colors.muted("  " + content));
  console.log();
}
