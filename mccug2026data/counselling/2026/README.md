# NEET-UG 2026 Counselling Seed Data

This folder contains the locked seed dataset for the NEET-to-MBBS counselling planner.

## Folder roles

### source/
Original official source documents. Preserve these unchanged for audit and re-import/reconciliation.
Do not read these PDFs directly on student-facing runtime requests.

### normalized/
Machine-readable seed records derived from the official sources. These are the files to use for the initial database seed/import. Once the database import pipeline is active, the database becomes the runtime source of truth.

### reference/
QA and analytical reference outputs. These are not runtime inputs and must not drive live recommendations directly.

## Initial source files
- nmc_mbbs_seat_matrix_2026_27.pdf — NMC MBBS annual capacity matrix, excluding INIs.
- mcc_round1_mbbs_seat_matrix_2026.pdf — MCC Round-1 MBBS seat matrix.
- mcc_round1_allotment_result_2026.pdf — MCC Round-1 allotment result.

## Initial normalized files
- nmc_college_capacity_2026.csv — cleaned NMC college/capacity table.
- mcc_round1_seat_matrix_2026.csv — normalized MCC category-level Round-1 seat matrix.
- mcc_round1_allotments_2026.csv — normalized MCC Round-1 MBBS allotment records, with Candidate Category, Allotted Category and PwD distinctions preserved.

## Reference files
- mcc_round1_reconciliation_qa.csv — matrix-vs-allotment reconciliation and AIR statistics for QA.
- neet_ug_2026_round2_planning_reference.xlsx — analytical workbook for validation/reference only.

## Important implementation rules
1. Do not place this folder under /public.
2. Official source files are immutable. New/revised official releases must be added as new import batches rather than overwriting old data.
3. Runtime calculations should use validated database records, not PDFs/XLSX files.
4. Derived/reference files must never override official source records.
5. NMC capacity is the non-INI denominator. INIs require MCC/separate official source data.
6. Candidate Category and Allotted Category must remain separate; PwD and special pathways must remain separate.
7. Round-1 matrix-allotment gap is not a Round-2 vacancy.
8. State data should be added later through the same authority/round/import pipeline.
