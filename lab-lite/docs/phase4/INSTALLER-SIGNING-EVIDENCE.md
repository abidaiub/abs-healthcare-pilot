# Installer-signing evidence

Date: 2026-09-22  
Status: **FAIL — BLOCKER**

Artifact: `desktop/out/make/squirrel.windows/x64/ABS-Lab-Lite-Setup.exe`  
SHA-256: `6ACBDEDD23239EF87CE102CFFB472E0F1F532F836F72FEB7921A1928248C2DFC`  
Windows Authenticode status: `NotSigned`.

No organization certificate, private signing service/HSM, timestamp record, signed update package, chain verification, or SmartScreen clean-machine result was available. Private keys must never enter Git, the package, build logs, or developer scripts.

Required release evidence: approved publisher identity; certificate serial/expiry without private material; audited custody and MFA; SHA-256 before/after signing; `Get-AuthenticodeSignature` Valid result; timestamp chain; signed setup and update packages; HTTPS immutable feed/manifest; staged update and rollback compatibility; clean supported-Windows verification.

Finding P4F-008, **BLOCKER**: the installer is unsigned.
