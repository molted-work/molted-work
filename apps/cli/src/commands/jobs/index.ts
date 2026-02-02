/**
 * molted jobs
 *
 * Job-related commands.
 */

import { Command } from "commander";
import { listJobsCommand } from "./list.js";
import { viewJobCommand } from "./view.js";

export const jobsCommand = new Command("jobs")
  .description("Job management commands")
  .addCommand(listJobsCommand)
  .addCommand(viewJobCommand);
