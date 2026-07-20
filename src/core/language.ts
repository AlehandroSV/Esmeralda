import * as fs from "fs";
import * as path from "path";

export interface LanguageInfo {
  name: string;
  schemaPaths: string[];
  migrationPaths: string[];
  seedPaths: string[];
  fileExtensions: string[];
  manifestFiles: string[];
}

export const LANGUAGES: Record<string, LanguageInfo> = {
  lua: {
    name: "lua",
    schemaPaths: ["schema/"],
    migrationPaths: ["migrations/"],
    seedPaths: ["seeds/"],
    fileExtensions: [".lua"],
    manifestFiles: [],
  },
  typescript: {
    name: "typescript",
    schemaPaths: ["src/schema/"],
    migrationPaths: ["src/migrations/"],
    seedPaths: ["src/seeds/"],
    fileExtensions: [".ts", ".tsx"],
    manifestFiles: ["package.json", "tsconfig.json"],
  },
  javascript: {
    name: "javascript",
    schemaPaths: ["src/schema/"],
    migrationPaths: ["src/migrations/"],
    seedPaths: ["src/seeds/"],
    fileExtensions: [".js", ".jsx"],
    manifestFiles: ["package.json"],
  },
  java: {
    name: "java",
    schemaPaths: ["src/main/java/**/model/"],
    migrationPaths: ["src/main/resources/db/migration/"],
    seedPaths: ["src/main/resources/db/seed/"],
    fileExtensions: [".java"],
    manifestFiles: ["pom.xml", "build.gradle"],
  },
  csharp: {
    name: "csharp",
    schemaPaths: ["Models/"],
    migrationPaths: ["Migrations/"],
    seedPaths: ["Seeds/"],
    fileExtensions: [".cs"],
    manifestFiles: ["*.csproj", "*.sln"],
  },
  ruby: {
    name: "ruby",
    schemaPaths: ["app/models/"],
    migrationPaths: ["db/migrate/"],
    seedPaths: ["db/seeds/"],
    fileExtensions: [".rb"],
    manifestFiles: ["Gemfile"],
  },
  go: {
    name: "go",
    schemaPaths: ["models/"],
    migrationPaths: ["migrations/"],
    seedPaths: ["seeds/"],
    fileExtensions: [".go"],
    manifestFiles: ["go.mod"],
  },
};

// Detect language from project directory
export function detectLanguage(projectRoot: string): string | null {
  // Check manifest files first (most reliable)
  for (const [lang, info] of Object.entries(LANGUAGES)) {
    for (const manifest of info.manifestFiles) {
      if (manifest.includes("*")) {
        // Glob pattern
        const pattern = manifest.replace("*", ".*");
        const files = fs.readdirSync(projectRoot);
        for (const file of files) {
          if (new RegExp(`^${pattern}$`).test(file)) {
            return lang;
          }
        }
      } else {
        if (fs.existsSync(path.join(projectRoot, manifest))) {
          return lang;
        }
      }
    }
  }

  // Check file extensions in project root
  const files = fs.readdirSync(projectRoot);
  const extCounts: Record<string, number> = {};

  for (const file of files) {
    if (fs.statSync(path.join(projectRoot, file)).isFile()) {
      const ext = path.extname(file);
      for (const [lang, info] of Object.entries(LANGUAGES)) {
        if (info.fileExtensions.includes(ext)) {
          extCounts[lang] = (extCounts[lang] || 0) + 1;
        }
      }
    }
  }

  // Return language with most files
  let bestLang: string | null = null;
  let bestCount = 0;
  for (const [lang, count] of Object.entries(extCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestLang = lang;
    }
  }

  return bestLang;
}

// Get schema paths for a language
export function getSchemaPaths(language: string): string[] {
  return LANGUAGES[language]?.schemaPaths || LANGUAGES.lua.schemaPaths;
}

// Get migration paths for a language
export function getMigrationPaths(language: string): string[] {
  return LANGUAGES[language]?.migrationPaths || LANGUAGES.lua.migrationPaths;
}

// Get seed paths for a language
export function getSeedPaths(language: string): string[] {
  return LANGUAGES[language]?.seedPaths || LANGUAGES.lua.seedPaths;
}

// Get language info
export function getLanguageInfo(language: string): LanguageInfo | null {
  return LANGUAGES[language] || null;
}
