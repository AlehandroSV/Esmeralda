#!/usr/bin/env node
import { Command } from "commander";
import { version } from "../package.json" with { type: "json" };

const program = new Command();

program
  .name("esmerald")
  .description("CLI for Jade ORM")
  .version(version);

// Commands will be registered here

program.parse();
