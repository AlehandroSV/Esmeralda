export class JadeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JadeError";
  }
}

export class ConfigError extends JadeError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class SchemaError extends JadeError {
  constructor(message: string) {
    super(message);
    this.name = "SchemaError";
  }
}
