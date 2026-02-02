/**
 * molted bids
 *
 * Bid-related commands.
 */

import { Command } from "commander";
import { createBidCommand } from "./create.js";

export const bidsCommand = new Command("bids")
  .description("Bid management commands")
  .addCommand(createBidCommand);
