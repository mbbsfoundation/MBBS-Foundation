# CPR Sanjeevani Operational System — Version 1.0 (System Freeze 2026)

**Document Status**: PRODUCTION-READY / FROZEN  
**System**: CPR Sanjeevani / National IAP CPR Day 2026 & MBBS Foundation Platform  
**Freeze Date**: September 2026  
**Operating Environment**: Production Ready  

---

## 1. Final System Architecture

The CPR Sanjeevani platform functions as a unified yet modular operational ecosystem. Each subsystem maintains clean boundary separation and operational independence while interoperating through strict, unidirectional data flows.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PUBLIC VISITORS                                 │
│  - /cprday (Home, Impact, Map, Gallery)                                     │
│  - /cprday#certificate-access (Public Search & Google Drive Download)       │
│  - /cprsanjeevani/verify/[state] (Coordinator Feedback & Verification)      │
│  - /mbbs-foundation/consultation (Professional & Student Voice Surveys)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COORDINATOR PORTAL                                 │
│  - /cprday (Coordinator sign-in & participant verification flow)            │
│  - Course Coordinator Auth (Separate HMAC session, isolated from Admin)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MASTER ADMIN PORTAL (/admin)                         │
│  - Authentication: Unified Master Admin Session (sanjeevani_admin_token)    │
│  ├── CPR Sanjeevani Programme Area:                                         │
│  │   ├── /admin/cpr/verifications (Verification Inbox & Closed-Loop Engine) │
│  │   ├── /cprsanjeevani (Master Certificate Search & Lookups)               │
│  │   ├── /cprsanjeevani/generate (Additive Certificate Generator)           │
│  │   └── /cprsanjeevani/verify/[state] (State Reconciliation Reports)       │
│  └── MBBS Foundation Programme Area:                                        │
│      ├── /admin/mbbs-foundation/consultation (Dashboard & Analytics)        │
│      ├── /api/admin/mbbs-foundation/export/professional (CSV Export)         │
│      └── /api/admin/mbbs-foundation/export/student (CSV Export)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Closed-Loop Verification Workflow

The end-to-end verification lifecycle guarantees that coordinator feedback never mutates authoritative data directly. Every correction traverses an audited, multi-stage review and implementation pipeline:

```
1. STATE REPORT GENERATION
   └── State report computed from Baseline Venues + Reconciliation Decisions + Overrides.
   
2. COORDINATOR SUBMISSION
   └── Coordinator visits /cprsanjeevani/verify/[state].
   └── Submits VERIFY_CORRECT, SUBMIT_CORRECTION, or MISSING_COURSE.
   └── Stored in PostgreSQL (CPRVerificationSubmission) with status PENDING_ADMIN_REVIEW.

3. ADMIN VERIFICATION INBOX (/admin/cpr/verifications)
   └── Master Admin reviews submission details, evidence, and risk classification.
   └── Admin transitions status: ACCEPTED, NEEDS_CLARIFICATION, or REJECTED.

4. ACTION REQUIRED & RISK CLASSIFICATION (Step 5B)
   └── ACCEPTED submissions surface under the "Action Required" filter.
   └── Automated classifier evaluates Risk (Low/Medium/High), Domain, and Census Impact.

5. CONTROLLED DOWNSTREAM IMPLEMENTATION (Step 5C)
   └── Admin opens Implementation Review Drawer.
   └── Previews prospective state and national count/venue deltas.
   └── Inputs mandatory audit note, evidence citation, and explicit confirmation.
   └── Action routes to appropriate downstream mechanism (Reconciliation Overlay or Decision).

6. REPORT RE-CALCULATION & CLOSED-LOOP VERIFICATION
   └── System immediately recalculates the State Report via getCPRDayReconciliationReport().
   └── Verifies that the adjustment is accurately reflected in live reporting output.

7. STATUS ADVANCEMENT TO IMPLEMENTED
   └── Submission status advances to IMPLEMENTED only after successful report verification.
   └── Comprehensive audit note and downstream action metadata persisted in PostgreSQL.
   
8. UPDATED CURRENT RECONCILED REPORT
   └── Public and Admin State Reports immediately display the verified, updated census.
```

---

## 3. Authoritative Data Layers & Storage Ownership

To ensure data integrity, immutability, and clear provenance, authoritative responsibilities are strictly partitioned across designated storage layers:

| Data Layer | Authoritative File / Store | Mutability | Ownership & Role |
|---|---|---|---|
| **Historical Baseline Venues** | `data/cpr_day_baseline_venues.json` | **IMMUTABLE** | Baseline record of all physical venues and course rosters from National IAP CPR Day 2026. |
| **Historical Draft V1 Snapshot** | `data/cpr_census_draft_v1_snapshot.json` | **FROZEN** | Baseline statistical snapshot published for state verification (395 courses, 292 venues, 47,033 trained, 33,477 certified). |
| **Venue Reconciliation Decisions** | `data/cpr_venue_reconciliation_decisions.json` | **CONTROLLED** | Master Admin mapping decisions (SAME_BASELINE_VENUE, NEW_PHYSICAL_VENUE, FURTHER_REVIEW_REQUIRED). |
| **Reconciliation Metadata Overrides** | `data/cpr_venue_metadata_overrides.json` | **RUNTIME OVERLAY** | Master Admin runtime overlay for verified venue spelling, city, faculty rosters, and count adjustments. |
| **Participant Certificate Records** | `cprcertificates/*.csv` (21 State CSVs) | **IMMUTABLE** | Pre-generated certificate records linking participants to direct Google Drive download URLs. |
| **Coordinator & Champion Masters** | `data/cpr_champions_master.json`, `data/cpr_coordinators_master.json` | **IMMUTABLE** | Master directories for faculty certificates and designations. |
| **Additive Admin Certificates** | PostgreSQL `AdminCertificateRecord` table | **ADDITIVE ONLY** | Newly issued or supplementary certificates generated via `/cprsanjeevani/generate`. |
| **Coordinator Verification Submissions** | PostgreSQL `CPRVerificationSubmission` table | **AUDITED LIFECYCLE** | Lifecycle records, notes, evidence references, and resolution history for coordinator feedback. |
| **Consultation Responses** | PostgreSQL `ProfessionalConsultation`, `StudentVoiceConsultation` | **LIVE SUBMISSION** | MBBS Foundation stakeholder consultation survey submissions. |

---

## 4. Historical Draft V1 vs. Current Reconciled Totals

### Historical Baseline (Draft V1)
Published as `CPRDAY_CENSUS_DRAFT_V1` (Frozen for State Verification):
- **States / UTs Represented**: 28
- **Courses**: 395
- **Physical Venues**: 292
- **Participants Trained**: 47,033
- **Participants Certified**: 33,477
- **Course Coordinators**: 217
- **CPR Champions**: 1,151

### Current Reconciled Totals (Step 6 System Freeze)
Recalculated via live reporting engine `getCPRDayReconciliationReport()`:
- **States / UTs Represented**: 28
- **Courses**: 395
- **Physical Venues**: 292
- **Participants Trained**: 47,033
- **Participants Certified**: 33,477
- **Course Coordinators**: 217
- **CPR Champions**: 1,151

> [!NOTE]
> **Drift Analysis**: Current Reconciled totals exactly match Historical Draft V1 totals because all test data and temporary fixtures have been cleanly removed, and no genuine count or venue modifications have been finalized into production data during validation.

---

## 5. Locked Invariants & System Safeguards

The following system safeguards are permanently locked:

1. **Zero Certificate Renumbering**: Existing certificate IDs are permanent and immutable.
2. **Authoritative Drive Links**: Google Drive certificate links are preserved and direct. No dynamic HTML certificates are generated for CPR Sanjeevani participants.
3. **No Automatic High-Risk Mutations**: Submissions with trained count or course count impacts require explicit Master Admin review, mandatory evidence citations, and prospective impact confirmation.
4. **Non-Mutating Verification**: Coordinator submissions never alter authoritative baseline data directly.
5. **Fail-Safe Implementation Pipeline**: A submission cannot transition to `IMPLEMENTED` unless the downstream operation succeeds and the recalculated State Report confirms the change.
6. **Immutable Historical Snapshot**: `data/cpr_census_draft_v1_snapshot.json` must never be overwritten. Live reconciled totals must always be labeled as `CURRENT RECONCILED / POST-VERIFICATION`.
7. **Authentication Separation**:
   - Master Admin authentication (`sanjeevani_admin_token`) governs administrative routes (`/admin/*`, `/cprsanjeevani/*`).
   - Course Coordinator authentication governs coordinator workflows.
   - Public certificate access (`/cprday#certificate-access`) and public state verification (`/cprsanjeevani/verify/[state]`) require zero authentication.
8. **MBBS Foundation Survey Integrity**: Survey editorial structures and validation schemas remain frozen. Professional consultation requires contact verification and consent; Student Voice core remains strictly anonymous.

---

## 6. System Route Map

### Public Routes
- `/` — Homepage
- `/cprday` — National IAP CPR Day 2026 Portal (Overview, Live Counters, State Map, Gallery)
- `/cprday#certificate-access` — Public CPR Certificate Search & Direct Google Drive Access
- `/cprsanjeevani/verify/[state]` — Public State Reconciliation Report & Coordinator Verification Portal
- `/mbbs-foundation/consultation` — MBBS Foundation Consultation (Professional Consultation & Student Voice)
- `/neet-to-mbbs/after-admission` — NEET to MBBS Guidance (with public CTA to `/cprday#certificate-access`)

### Master Admin Routes (Protected)
- `/admin` — Unified Master Admin Portal Hub
- `/admin/cpr/verifications` — CPR Verification Inbox & Closed-Loop Implementation Engine
- `/cprsanjeevani` — CPR Sanjeevani Master Certificate Search & Lookup
- `/cprsanjeevani/generate` — Additive Certificate Generator
- `/admin/mbbs-foundation/consultation` — MBBS Foundation Consultation Analytics & Data Hub

### API Endpoints
- `/api/cprsanjeevani/verify/submit` — Coordinator feedback ingestion
- `/api/cprsanjeevani/verify/admin/review` — Master Admin verification status updates (Accept/Reject/Clarify)
- `/api/cprsanjeevani/verify/implement` — Downstream implementation review & execution engine
- `/api/cprsanjeevani/certificates` — Public & Admin certificate search API
- `/api/cprsanjeevani/auth` — Master Admin session authentication
- `/api/mbbs-foundation/consultation/submit` — Professional consultation ingestion
- `/api/mbbs-foundation/student-voice/submit` — Student voice survey ingestion
- `/api/admin/mbbs-foundation/export/professional` — Professional consultation CSV export
- `/api/admin/mbbs-foundation/export/student` — Student voice CSV export

---

## 7. Verification Inbox Baseline at Freeze

| Status Category | Count | Detail / Notes |
|---|---|---|
| **Total Submissions** | **2** | All verified genuine coordinator submissions. |
| **PENDING_ADMIN_REVIEW** | **2** | `VERIF-1788523929316-ECHM` & `VERIF-1788527605354-VGT6` (Buldhana, Maharashtra). |
| **NEEDS_CLARIFICATION** | **0** | Clean baseline. |
| **ACCEPTED** | **0** | Clean baseline. |
| **REJECTED** | **0** | Clean baseline. |
| **IMPLEMENTED** | **0** | Clean baseline. |
| **ACTION REQUIRED** | **0** | Zero pending downstream implementations. |

---

## 8. Future Maintenance Rules

1. Any future modifications to the CPR Sanjeevani platform must preserve the 8 locked invariants detailed in Section 5.
2. No automated script may write directly to `data/cpr_day_baseline_venues.json` or `data/cpr_census_draft_v1_snapshot.json`.
3. Any new certificate categories must follow additive generation via `AdminCertificateRecord` without renumbering historical records.
4. Database migrations are prohibited unless accompanied by a separately approved, isolated schema evolution plan.

---

## 9. Production Deployment Record

- **Deployment Timestamp**: 2026-09-05 11:48:36 IST
- **Git Branch Deployed**: `main`
- **Frozen Commit Hash**: `57ec1f9` (`CPR Sanjeevani V1.0 — production-ready system freeze`)
- **Deployment Status**: `SUCCESS / READY`
- **Production Domain**: `https://mbbsfoundation.com`
- **Live Smoke Test Result**: `PASS (All Public & Admin Routes Verified)`

