# Windows reboot and offline cold-start evidence

Date: 2026-09-22  
Status: **NOT RUN — BLOCKER**

The installed 0.1.0 client and preserved Electron data are present on this Windows PC, but Windows was not rebooted during this run. A process restart is not accepted as reboot evidence.

The witnessed field test must install the frozen signed candidate, activate and sync, create a known synthetic fixture, disconnect network, reboot Windows, open the client, open the encrypted DB, perform bounded offline login, create patient/bill, render or physically print, close/reopen, reconnect/sync, and prove one cloud bill/payment identity with no duplicate. Attach boot timestamps, app/log extracts, redacted screenshots, operation/receipt identity, and two-person sign-off.

Finding P4F-006, **BLOCKER**: real reboot/offline cold start remains unproven.
