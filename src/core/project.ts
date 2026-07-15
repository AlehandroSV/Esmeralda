import * as fs from "fs";
import * as path from "path";

const CONFIG_FILE = "jade.config.lua";

export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let current = startDir;

  while (true) {
    if (fs.existsSync(path.join(current, CONFIG_FILE))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export function getConfigPath(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_FILE);
}
