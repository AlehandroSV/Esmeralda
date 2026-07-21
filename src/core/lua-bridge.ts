export class LuaBridge {
  private luaPath: string;

  constructor(luaPath = "lua") {
    this.luaPath = luaPath;
  }

  /**
   * Escape a string for safe embedding in a Lua string literal.
   * Handles backslashes, double quotes, single quotes, newlines, and null bytes.
   */
  private escapeLuaString(str: string): string {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\0/g, "\\0");
  }

  async execute(code: string): Promise<any> {
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const exec = promisify(execFile);

    const wrappedCode = `
      local json = require("dkjson")
      local result = (function()
        ${code}
      end)()
      print(json.encode(result))
    `;

    const { stdout } = await exec(this.luaPath, ["-e", wrappedCode]);
    return JSON.parse(stdout.trim());
  }

  async executeFile(path: string, args: Record<string, any> = {}): Promise<any> {
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const exec = promisify(execFile);

    // Validate path doesn't contain path traversal
    const normalizedPath = path.replace(/\\/g, "/");
    if (normalizedPath.includes("..")) {
      throw new Error(`Invalid path: path traversal detected (${path})`);
    }

    const argsLua = `ARGS = ${JSON.stringify(args)}`;
    const { stdout } = await exec(this.luaPath, ["-e", argsLua, path]);
    return JSON.parse(stdout.trim());
  }

  /**
   * Execute a Lua code string safely by writing it to a temp file
   * instead of passing via -e (avoids shell escaping issues).
   */
  async executeSafe(code: string, args: Record<string, any> = {}): Promise<any> {
    const { execFile } = require("child_process");
    const { promisify } = require("util");
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const exec = promisify(execFile);

    const tmpFile = path.join(os.tmpdir(), `jade_lua_${Date.now()}_${Math.random().toString(36).slice(2)}.lua`);
    try {
      const argsLua = `ARGS = ${JSON.stringify(args)}`;
      const fullCode = argsLua + "\n" + code;
      fs.writeFileSync(tmpFile, fullCode, "utf-8");
      const { stdout } = await exec(this.luaPath, [tmpFile]);
      return JSON.parse(stdout.trim());
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}
