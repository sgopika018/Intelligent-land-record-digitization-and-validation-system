import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("landRecords", () => {
  it("ships three seeded demo records with distinct risk outcomes", async () => {
    const caller = appRouter.createCaller(createContext());
    const records = await caller.landRecords.list();

    expect(records).toHaveLength(3);
    expect(records.map(record => record.riskBand)).toEqual(["Low", "Medium", "High"]);
    expect(records.find(record => record.surveyNumber === "114/2A")?.status).toBe("Verified");
    expect(records.find(record => record.surveyNumber === "77/4B")?.checks.some(check => check.status === "mismatch")).toBe(true);
    expect(records.find(record => record.surveyNumber === "52/1C")?.duplicateProbability).toBe(96);
  });

  it("records an officer decision and adds an audit trail entry", async () => {
    const caller = appRouter.createCaller(createContext());
    const before = await caller.landRecords.get({ id: "LR-2026-002" });
    const beforeStatus = before?.status;
    const result = await caller.landRecords.review({ id: "LR-2026-002", decision: "Approved", note: "Test officer approval" });

    expect(beforeStatus).toBe("Pending review");
    expect(result.success).toBe(true);
    expect(result.record?.status).toBe("Verified");
    expect(result.record?.auditTrail[0]?.action).toBe("Approved");
    expect(result.record?.auditTrail[0]?.note).toBe("Test officer approval");
  });
});
