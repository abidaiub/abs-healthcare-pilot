# MOD-01 Manual QC Pack

Independent Manual Quality Control and UAT materials for **MOD-01 — Company / Tenant Management**.

---

## Purpose

AI Re-QC passed (`reports/001-Foundation-ReQC-01.md`). Final module approval requires execution of this manual QC pack by an independent QC engineer **against the QC Docker environment only** — not live customer production.

---

## Folder Structure

```
manual-qc/
├── README.md                          # This file
├── source/
│   ├── 001-CompanyTenant-Manual-QC-v1.0.md   # Editable guide (English + Bangla notes)
│   └── 001-QC-Engineer-QuickStart-v1.0.md    # Setup + workflow for QC engineers
├── pdf/
│   ├── 001-CompanyTenant-Manual-QC-v1.0.pdf  # Full test cases (distributable)
│   └── 001-QC-Engineer-QuickStart-v1.0.pdf # Setup, commands, workflow (distributable)
├── results/
│   └── 001-CompanyTenant-Manual-QC-Result-Template.md
├── evidence/
│   └── 001-CompanyTenant/
│       ├── screenshots/
│       ├── database/
│       ├── security/
│       └── deployment/
└── .local/                            # Gitignored — credentials for QC team only
    └── 001-QC-Credentials.txt
```

---

## Workflow

1. Confirm QC Docker deployment is **SUCCESS** (see latest deployment report in `evidence/001-CompanyTenant/deployment/`).
2. Obtain credentials from `.local/001-QC-Credentials.txt` through secure channel (not email).
3. Copy `results/001-CompanyTenant-Manual-QC-Result-Template.md` to a dated result file.
4. Execute every test case in the PDF/source guide; default status **NOT RUN** until executed.
5. Store evidence under `evidence/001-CompanyTenant/` using naming convention `MOD01-<TCID>-StepNN.png`.
6. Complete sign-off only when exit criteria in Section 13 are met.

---

## MOD-01 Status Tracker

| Gate | Status |
|------|--------|
| AI QC | PASS (`001-Foundation-ReQC-01.md`) |
| Independent AI Review | PASS (Re-QC-01) |
| Manual QC Guide | **READY** |
| Manual QC PDF | **READY** — 19 pages (`pdf/001-CompanyTenant-Manual-QC-v1.0.pdf`) |
| QC Engineer Quick Start PDF | **READY** — (`pdf/001-QC-Engineer-QuickStart-v1.0.pdf`) |
| QC Docker Deployment | **BLOCKED** — see `evidence/001-CompanyTenant/deployment/` |
| Manual QC Execution | **PENDING** |
| UAT | **PENDING** |
| Production Approval | **NOT APPROVED** |

---

## Related Documents

- `../reports/001-Foundation.md` — Original AI QC
- `../reports/001-Foundation-ReQC-01.md` — Post-fix Re-QC
- `../../QC/ABSHealthcareLite-Pilot-Docker-QC-Guide.md` — Docker QC server details
- `../../01-CompanyTenant/CompanyTenant_v1.md` — Module Book

---

## Confidentiality

PDF footer: **ABSHealthcareLite - QC Use Only**

Do not distribute credentials in the PDF, email, or screenshots.
