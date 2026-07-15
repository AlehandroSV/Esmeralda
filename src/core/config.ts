export function loadTemplate(name: string): string {
  const fs = require("fs");
  const path = require("path");
  const templatePath = path.join(__dirname, "..", "templates", name);
  return fs.readFileSync(templatePath, "utf-8");
}
