import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

type CheckStatus = "matched" | "warning" | "mismatch";
type RiskBand = "Low" | "Medium" | "High";

type ValidationCheck = {
  label: string;
  source: string;
  status: CheckStatus;
  detail: string;
};

type LandRecord = {
  id: string;
  documentName: string;
  documentType: string;
  processedAt: string;
  ownerName: string;
  surveyNumber: string;
  pattaNumber: string;
  village: string;
  taluk: string;
  district: string;
  area: number;
  registrationDate: string;
  mutationDate: string;
  ocrConfidence: number;
  recordMatch: number;
  gisMatch: number;
  duplicateProbability: number;
  riskScore: number;
  riskBand: RiskBand;
  status: "Verified" | "Pending review" | "Flagged";
  decision: "Approved" | "Pending" | "Rejected" | "Flagged for manual review";
  decisionNote: string;
  checks: ValidationCheck[];
  gis: { calculatedArea: number; lat: number; lng: number; polygon: string };
  ownershipHistory: { year: number; owner: string; event: string; current?: boolean }[];
  auditTrail: { action: string; officer: string; timestamp: string; note: string }[];
};

const now = new Date().toISOString();

const seededRecords: LandRecord[] = [
  {
    id: "LR-2026-001",
    documentName: "patta_114-2A_ramanathan.pdf",
    documentType: "Patta extract",
    processedAt: "08 Sep 2026 · 14:22",
    ownerName: "R. Ramanathan",
    surveyNumber: "114/2A",
    pattaNumber: "PT-2017-8842",
    village: "Kovilpatti",
    taluk: "Ottapidaram",
    district: "Thoothukudi",
    area: 2.14,
    registrationDate: "17 Mar 2017",
    mutationDate: "06 Apr 2017",
    ocrConfidence: 98,
    recordMatch: 100,
    gisMatch: 99,
    duplicateProbability: 2,
    riskScore: 8,
    riskBand: "Low",
    status: "Verified",
    decision: "Approved",
    decisionNote: "All source records agree and cadastral area is within tolerance.",
    checks: [
      { label: "Owner identity", source: "Patta · Registration · Mutation", status: "matched", detail: "R. Ramanathan matches across all three source records." },
      { label: "Survey number", source: "Patta register", status: "matched", detail: "Survey number 114/2A is present and active in the village register." },
      { label: "Declared area", source: "GIS parcel layer", status: "matched", detail: "2.14 acres declared vs 2.12 acres calculated (0.9% variance)." },
      { label: "Registration & mutation dates", source: "Registration / Mutation", status: "matched", detail: "Mutation follows registration by 20 days; sequence is valid." },
      { label: "Duplicate screening", source: "Flagged filings index", status: "matched", detail: "No known duplicate filing or suspicious formatting pattern." },
    ],
    gis: { calculatedArea: 2.12, lat: 8.9876, lng: 77.7932, polygon: "34,12 158,28 192,90 168,154 64,168 20,112" },
    ownershipHistory: [
      { year: 2004, owner: "S. Muthusamy", event: "Original patta holder" },
      { year: 2011, owner: "P. Krishnaveni", event: "Registered transfer" },
      { year: 2017, owner: "R. Ramanathan", event: "Mutation recorded", current: true },
    ],
    auditTrail: [
      { action: "Approved", officer: "S. Meenakshi", timestamp: "08 Sep 2026 · 14:25", note: "Verified after three-way source match." },
      { action: "OCR processed", officer: "System", timestamp: "08 Sep 2026 · 14:22", note: "Printed Tamil + English document processed." },
    ],
  },
  {
    id: "LR-2026-002",
    documentName: "registration_77-4b_sivakumar.jpg",
    documentType: "Registration deed",
    processedAt: "08 Sep 2026 · 13:48",
    ownerName: "K. Sivakumar",
    surveyNumber: "77/4B",
    pattaNumber: "PT-2019-2218",
    village: "Melur East",
    taluk: "Melur",
    district: "Madurai",
    area: 1.86,
    registrationDate: "12 Aug 2019",
    mutationDate: "18 Sep 2019",
    ocrConfidence: 91,
    recordMatch: 72,
    gisMatch: 83,
    duplicateProbability: 14,
    riskScore: 46,
    riskBand: "Medium",
    status: "Pending review",
    decision: "Pending",
    decisionNote: "Officer review required: declared area and registration date need reconciliation.",
    checks: [
      { label: "Owner identity", source: "Patta · Registration · Mutation", status: "matched", detail: "K. Sivakumar matches the patta and mutation entries." },
      { label: "Survey number", source: "Registration register", status: "matched", detail: "Survey number 77/4B found, but one legacy scan uses 77/4-B." },
      { label: "Declared area", source: "GIS parcel layer", status: "mismatch", detail: "Document says 1.86 acres; cadastral parcel calculates 1.62 acres (14.8% variance)." },
      { label: "Registration & mutation dates", source: "Registration / Mutation", status: "warning", detail: "Mutation is 37 days after registration; outside the usual 30-day pattern." },
      { label: "Duplicate screening", source: "Flagged filings index", status: "matched", detail: "No duplicate filing found for 77/4B." },
    ],
    gis: { calculatedArea: 1.62, lat: 10.0321, lng: 78.3384, polygon: "28,22 170,18 202,70 178,148 82,172 18,106" },
    ownershipHistory: [
      { year: 1998, owner: "M. Alagarsamy", event: "Original patta holder" },
      { year: 2012, owner: "M. Alagarsamy", event: "Subdivision recorded" },
      { year: 2019, owner: "K. Sivakumar", event: "Registered transfer", current: true },
    ],
    auditTrail: [
      { action: "Queued for review", officer: "System", timestamp: "08 Sep 2026 · 13:49", note: "Medium risk threshold exceeded." },
      { action: "OCR processed", officer: "System", timestamp: "08 Sep 2026 · 13:48", note: "Printed English registration deed processed." },
    ],
  },
  {
    id: "LR-2026-003",
    documentName: "mutation_52-1c_priya_scan.png",
    documentType: "Mutation register scan",
    processedAt: "08 Sep 2026 · 12:16",
    ownerName: "P. Priya",
    surveyNumber: "52/1C",
    pattaNumber: "PT-2016-1190",
    village: "Thiruvaiyaru",
    taluk: "Thiruvaiyaru",
    district: "Thanjavur",
    area: 3.40,
    registrationDate: "04 Nov 2016",
    mutationDate: "02 Dec 2016",
    ocrConfidence: 76,
    recordMatch: 48,
    gisMatch: 61,
    duplicateProbability: 96,
    riskScore: 87,
    riskBand: "High",
    status: "Flagged",
    decision: "Flagged for manual review",
    decisionNote: "Known duplicate survey filing. Do not finalize until chain of title is inspected.",
    checks: [
      { label: "Owner identity", source: "Patta · Registration · Mutation", status: "warning", detail: "P. Priya matches mutation, but registration scan shows P. Preeya." },
      { label: "Survey number", source: "Duplicate filings index", status: "mismatch", detail: "Survey number 52/1C has two prior filings with overlapping transfer dates." },
      { label: "Declared area", source: "GIS parcel layer", status: "mismatch", detail: "Document says 3.40 acres; cadastral parcel calculates 2.78 acres (22.4% variance)." },
      { label: "Registration & mutation dates", source: "Registration / Mutation", status: "warning", detail: "Mutation predates the latest registration amendment by 11 days." },
      { label: "Duplicate screening", source: "Flagged filings index", status: "mismatch", detail: "Duplicate probability 96%; prior filing LR-2024-188 is still unresolved." },
    ],
    gis: { calculatedArea: 2.78, lat: 10.8851, lng: 79.1033, polygon: "48,12 186,38 194,112 138,166 38,152 20,68" },
    ownershipHistory: [
      { year: 2001, owner: "V. Subramanian", event: "Original patta holder" },
      { year: 2010, owner: "V. Subramanian", event: "Family transfer" },
      { year: 2016, owner: "P. Preeya", event: "Registration amendment" },
      { year: 2016, owner: "P. Priya", event: "Conflicting mutation", current: true },
    ],
    auditTrail: [
      { action: "Flagged for manual review", officer: "System", timestamp: "08 Sep 2026 · 12:17", note: "Known duplicate and multiple cross-source mismatches." },
      { action: "OCR processed", officer: "System", timestamp: "08 Sep 2026 · 12:16", note: "Handwritten Tamil mutation scan processed with lower confidence." },
    ],
  },
];

let records = [...seededRecords];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  landRecords: router({
    list: publicProcedure.query(() => records),
    get: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => records.find(record => record.id === input.id) ?? null),
    review: publicProcedure
      .input(z.object({ id: z.string(), decision: z.enum(["Approved", "Rejected", "Flagged for manual review"]), note: z.string().optional() }))
      .mutation(({ input }) => {
        const record = records.find(item => item.id === input.id);
        if (!record) return { success: false as const, message: "Record not found" };
        record.decision = input.decision;
        record.status = input.decision === "Approved" ? "Verified" : input.decision === "Rejected" ? "Flagged" : "Pending review";
        record.decisionNote = input.note ?? `Officer decision recorded as ${input.decision}.`;
        record.auditTrail.unshift({ action: input.decision, officer: "S. Meenakshi", timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), note: record.decisionNote });
        return { success: true as const, record };
      }),
    processUpload: publicProcedure
      .input(z.object({ filename: z.string(), language: z.string().default("English + Tamil") }))
      .mutation(({ input }) => {
        const id = `LR-2026-${String(records.length + 1).padStart(3, "0")}`;
        const uploaded: LandRecord = {
          ...seededRecords[0],
          id,
          documentName: input.filename,
          documentType: "Uploaded document",
          processedAt: "08 Sep 2026 · just now",
          ownerName: "Extracted from upload",
          surveyNumber: "Awaiting officer confirmation",
          pattaNumber: "Awaiting officer confirmation",
          ocrConfidence: 88,
          recordMatch: 0,
          gisMatch: 0,
          duplicateProbability: 0,
          riskScore: 54,
          riskBand: "Medium",
          status: "Pending review",
          decision: "Pending",
          decisionNote: `OCR simulation complete for ${input.language}. Confirm extracted fields before validation.`,
          checks: [
            { label: "OCR + preprocessing", source: "Document pipeline", status: "matched", detail: "Denoise, deskew, contrast enhancement and OCR completed." },
            { label: "Field extraction", source: "Rule-based NER", status: "warning", detail: "Fields extracted with 88% confidence; survey number needs human confirmation." },
            { label: "Cross-source validation", source: "Patta · Registration · Mutation", status: "warning", detail: "Validation will run after the officer confirms the survey number." },
            { label: "GIS parcel check", source: "Mock cadastral layer", status: "warning", detail: "No parcel selected yet." },
            { label: "Duplicate screening", source: "Flagged filings index", status: "matched", detail: "No duplicate check performed until survey number is confirmed." },
          ],
          auditTrail: [{ action: "OCR processed", officer: "System", timestamp: now, note: `Uploaded ${input.filename}; ${input.language} recognition enabled.` }],
        };
        records = [uploaded, ...records];
        return { success: true as const, record: uploaded };
      }),
  }),
});

export type AppRouter = typeof appRouter;
