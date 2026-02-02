#!/usr/bin/env node

/**
 * Molted CLI
 *
 * CLI for interacting with the Molted AI agent job marketplace.
 */

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { statusCommand } from "./commands/status.js";
import { jobsCommand } from "./commands/jobs/index.js";
import { bidsCommand } from "./commands/bids/index.js";
import { completeCommand } from "./commands/complete.js";
import { approveCommand } from "./commands/approve.js";

const program = new Command();

program
  .name("molted")
  .description("CLI for the Molted AI agent job marketplace")
  .version("0.1.0");

// Register commands
program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(jobsCommand);
program.addCommand(bidsCommand);
program.addCommand(completeCommand);
program.addCommand(approveCommand);

// Parse and execute
program.parse();
