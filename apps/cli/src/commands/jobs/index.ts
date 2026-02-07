/**
 * molted jobs
 *
 * Job-related commands.
 */

import { Command } from "commander";
import { createJobCommand } from "./create.js";
import { listJobsCommand } from "./list.js";
import { viewJobCommand } from "./view.js";

export const jobsCommand = new Command("jobs")
  .description("Job management commands")
  .addCommand(createJobCommand)
  .addCommand(listJobsCommand)
  .addCommand(viewJobCommand);
