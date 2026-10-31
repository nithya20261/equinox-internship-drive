import { describe, it, expect } from "vitest";
import { verifyPassEligibility } from "@/lib/pass-eligibility";

// Mirrors the non-Premium accounts that exist in the live students table.
describe("Premium Pass gate", () => {
  it("allows an approved Premium Pass CNF", () => {
    expect(verifyPassEligibility({ cnfNumber: "CNF-22033C" }).allowed).toBe(true);
  });

  it.each(["EQX-2026", "EQX-APP", "EQTEST001", "CNF-0158CB", "EQX-STUDENT", ""])("denies %s", (cnf) => {
    expect(verifyPassEligibility({ cnfNumber: cnf }).allowed).toBe(false);
  });

  it("allows CNF000 only outside production", () => {
    const prev = process.env["NODE_ENV"];
    process.env["NODE_ENV"] = "production";
    expect(verifyPassEligibility({ cnfNumber: "CNF000" }).allowed).toBe(false);
    process.env["NODE_ENV"] = prev;
  });
});
