export class LuaBridge {
  private luaPath: string;

  constructor(luaPath = "lua") {
    this.luaPath = luaPath;
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

    const argsLua = `ARGS = ${JSON.stringify(args)}`;
    const { stdout } = await exec(this.luaPath, ["-e", argsLua, path]);
    return JSON.parse(stdout.trim());
  }
}
