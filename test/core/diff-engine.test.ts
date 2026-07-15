import { describe, it, expect } from "vitest";
import { DiffEngine } from "../../src/core/diff-engine.js";

describe("DiffEngine", () => {
  const engine = new DiffEngine();

  it("detects new tables", () => {
    const desired = [{ name: "users", columns: [] }];
    const current: any[] = [];

    const diff = engine.compute(desired, current);
    expect(diff.createTables).toHaveLength(1);
    expect(diff.createTables[0].name).toBe("users");
  });

  it("detects tables to drop", () => {
    const desired: any[] = [];
    const current = [{ name: "old_table", columns: [] }];

    const diff = engine.compute(desired, current);
    expect(diff.dropTables).toHaveLength(1);
    expect(diff.dropTables[0]).toBe("old_table");
  });

  it("detects new columns", () => {
    const desired = [{
      name: "users",
      columns: [{ name: "email", type: "VARCHAR" }]
    }];
    const current = [{
      name: "users",
      columns: []
    }];

    const diff = engine.compute(desired, current);
    expect(diff.addColumns).toHaveLength(1);
    expect(diff.addColumns[0].column.name).toBe("email");
  });

  it("detects columns to drop", () => {
    const desired = [{
      name: "users",
      columns: []
    }];
    const current = [{
      name: "users",
      columns: [{ name: "old_field", type: "VARCHAR" }]
    }];

    const diff = engine.compute(desired, current);
    expect(diff.dropColumns).toHaveLength(1);
    expect(diff.dropColumns[0].column).toBe("old_field");
  });

  it("detects column changes", () => {
    const desired = [{
      name: "users",
      columns: [{ name: "name", type: "VARCHAR", length: 255 }]
    }];
    const current = [{
      name: "users",
      columns: [{ name: "name", type: "VARCHAR", length: 100 }]
    }];

    const diff = engine.compute(desired, current);
    expect(diff.modifyColumns).toHaveLength(1);
  });

  it("reports empty diff when equal", () => {
    const schema = [{ name: "users", columns: [{ name: "id", type: "INTEGER" }] }];

    const diff = engine.compute(schema, schema);
    expect(engine.isEmpty(diff)).toBe(true);
  });
});
