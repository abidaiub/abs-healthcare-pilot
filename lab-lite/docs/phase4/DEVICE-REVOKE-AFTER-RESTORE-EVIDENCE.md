# Device revoke-after-restore evidence

Date: 2026-09-22  
Status: **PASS at server protocol / NOT RUN as native field drill**

Automated Phase 3 evidence passes: after authoritative device status becomes `REVOKED`, a queued operation using the prior device identity is preserved in the server inbox, quarantined, and not applied. The desktop restore accepts only a backup decryptable with the current DPAPI-protected key and matching device identity; it does not mint a new device or modify server authorization.

This does not replace the required real drill. On an activated field PC: create backup; revoke server device; restore the old backup through the guarded workflow; attempt offline use within the bounded lease; reconnect; verify the server rejects/quarantines sync; verify no cloud bill/payment posts; record device epoch/status, operation identity, logs, and reconciliation. Offline bounded authorization may remain usable until its signed lease limit; server revocation is authoritative on reconnect.

Finding P4F-009, **HIGH**: the exact native backup→revoke→restore sequence is NOT RUN.
