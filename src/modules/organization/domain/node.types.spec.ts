import { describe, expect, it } from "bun:test";
import { NODE_TYPES } from "./node.types";

describe("NODE_TYPES", () => {
  it("exposes USER and GROUP", () => {
    expect(NODE_TYPES.USER).toBe("USER");
    expect(NODE_TYPES.GROUP).toBe("GROUP");
  });
});
