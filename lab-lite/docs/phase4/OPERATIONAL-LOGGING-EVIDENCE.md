# Operational logging evidence

Date: 2026-09-22  
Status: **PASS in source/regression; native field collection NOT RUN**

The Electron client now writes rotating JSON Lines logs under `%APPDATA%\abs-lab-lite-desktop\logs\operations.jsonl`, maximum 5 MiB per file with five rotated files. Events cover app start/stop, local encrypted DB open, activation, offline login category, clock rollback, sync start/end/retry/failure/conflict, server revocation detection, backup, restore, and receipt opening.

The logger accepts only a fixed metadata allowlist (version, result/category, duration, counts, checkpoint, and format). It cannot persist caller-supplied passwords, tokens, keys, activation secrets, patient fields, payment payloads, operation IDs, or free-form error messages. The desktop regression forced rotation and proved a disallowed `password` field/value was absent.

Validation: desktop TypeScript check PASS; isolated desktop bundle PASS; SQLCipher/local-store regression PASS. Native installed-log generation and support export are still NOT RUN and must be included in field UAT.
