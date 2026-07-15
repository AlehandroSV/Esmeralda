#!/usr/bin/env tsx
import { Command } from "commander";
import { registerInit } from "../cli/init.js";

const program = new Command();

program
  .name("esmerald")
  .description("CLI for Jade ORM")
  .version("0.1.0");

registerInit(program);

program.parse();
