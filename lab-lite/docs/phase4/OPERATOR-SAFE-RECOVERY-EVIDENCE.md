# Operator-safe recovery evidence

Date: 2026-09-22  
Status: **PASS in source/regression / NOT RUN with operator**

The existing encrypted backup mechanics are unchanged. The desktop now adds a guarded restore command that:

1. lets support/operator choose one `.db` backup;
2. copies it to controlled staging;
3. opens it with the current DPAPI-protected key and validates matching device identity;
4. displays pending/conflict/checkpoint summary and requires explicit confirmation;
5. creates a hashed safety backup of current state;
6. closes writes and signs out;
7. atomically displaces the current DB and promotes the validated backup;
8. reopens the encrypted DB;
9. rolls back to the displaced DB if reopen fails;
10. retains safety/displaced evidence and instructs reconnect/reconciliation before posting.

Regression evidence covers encrypted backup reopen, device/operation/receipt/checkpoint preservation, wrong-key rejection, logging redaction, and desktop build/typecheck. A witnessed operator restore and cloud reconciliation remain NOT RUN.

Finding P4F-010, **HIGH**: field usability/recovery timing and support sign-off remain open.
