export class Logger {
  static info(message: string): void {
    console.log(`\x1b[36m[info]\x1b[0m ${message}`);
  }

  static success(message: string): void {
    console.log(`\x1b[32m[success]\x1b[0m ${message}`);
  }

  static warn(message: string): void {
    console.log(`\x1b[33m[warn]\x1b[0m ${message}`);
  }

  static error(message: string): void {
    console.error(`\x1b[31m[error]\x1b[0m ${message}`);
  }

  static sql(sql: string): void {
    console.log(`\x1b[35m[sql]\x1b[0m ${sql}`);
  }
}
