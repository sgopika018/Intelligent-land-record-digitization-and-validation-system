# Bhoomi Sentinel

**Bhoomi Sentinel — Intelligent Land Record Digitization and Validation System** is a Smart India Hackathon prototype for turning scanned land records into explainable validation decisions for revenue officers.

The prototype demonstrates the full officer flow: document intake, preprocessing/OCR simulation, structured field extraction, multi-source checks, cadastral/GIS comparison, duplicate screening, ownership history, risk scoring, explainable reports, and human-in-the-loop decisions.

## Demo capabilities

- **Officer dashboard:** total processed, verified, mismatched, flagged, and pending-review counts.
- **Document intake:** accepts JPG, PNG, and PDF selections; the demo simulates denoise, deskew, contrast enhancement, and English + Tamil OCR.
- **Field extraction:** displays owner name, survey number, patta number, village, taluk, district, area, registration date, and mutation date.
- **Multi-source validation:** compares the extracted values against mock Patta, Registration, and Mutation records.
- **GIS validation:** shows a mock cadastral polygon, centroid, coordinates, calculated parcel area, and match percentage.
- **Duplicate and anomaly screening:** flags known duplicate survey filings and cross-source inconsistencies.
- **Ownership timeline:** shows past owners and transfer events for the selected parcel.
- **Risk score:** combines OCR confidence, record match, GIS match, and duplicate probability into a 0–100 score and Low / Medium / High band.
- **Explainable report:** each check is rendered as a match, warning, or mismatch with a plain-language explanation and recommendation.
- **Human review:** officers can Approve, Reject, or Flag for manual review. Each decision is added to an in-memory audit trail.
- **Responsive UI:** the workspace adapts to mobile, tablet, and desktop layouts.

## Seeded demo records

| Survey number | Intended outcome | Risk | Demo signal |
| --- | --- | --- | --- |
| `114/2A` | Auto-verified | Low · 8 | All three source records agree; GIS variance is within tolerance. |
| `77/4B` | Officer review | Medium · 46 | Declared area differs from the cadastral area; mutation timing is unusual. |
| `52/1C` | Manual investigation | High · 87 | Known duplicate filing, owner spelling mismatch, and overlapping transfer history. |

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Express + tRPC 11 server
- Drizzle/MySQL scaffold supplied by WebDev
- Lucide icons
- Vitest for server procedure tests
- Mock cadastral data rendered as an SVG map layer

## Run locally

```bash
pnpm install
pnpm dev
```

The development server runs on the port selected by the WebDev scaffold. Open the preview URL shown by the dev server.

Useful commands:

```bash
pnpm check   # TypeScript validation
pnpm test    # Vitest suite
pnpm build   # Vite client build + production server bundle
```

## Prototype architecture

`server/routers.ts` contains the in-memory seed dataset and public tRPC procedures:

- `landRecords.list` returns the current registry workspace.
- `landRecords.get` returns one validation report.
- `landRecords.processUpload` creates a simulated OCR result for an uploaded filename.
- `landRecords.review` applies an officer decision and appends an audit entry.

The WebDev full-stack scaffold remains available for replacing the demo store with persistent Drizzle tables and authenticated officer roles. No live government integration is required to run the prototype.

## Production follow-ups

A production deployment would replace the simulated OCR call with Tesseract/PaddleOCR plus a handwriting model, persist records and validation logs in PostgreSQL/PostGIS, load official cadastral boundaries, add role-based access and document storage, and introduce a transformer-based multilingual NER model for extraction. The prototype intentionally keeps the final decision with the human officer; the AI only assists with evidence gathering and risk triage.
