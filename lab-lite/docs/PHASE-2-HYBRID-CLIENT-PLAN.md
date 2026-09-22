# Phase 2 hybrid-client compatibility plan

Phase 2 remains an online PostgreSQL application. It does not claim offline billing, offline due collection, or offline refund capability. This document records the constraints that the later installed branch client must satisfy without weakening the financial controls delivered in Phase 2.

## Target topology

- The cloud service remains the system of record and owns the PostgreSQL ledger.
- One installed branch service owns an encrypted SQLite store for that installation. Browser caches are not an accounting database.
- Device activation binds a generated device identity and protected device key to one tenant and branch. Revocation and key rotation must be supported.
- The installed service exposes only a loopback interface and must authenticate every local caller.

## Offline authentication and authority

- Online login may issue a short-lived, signed offline grant containing user, tenant, branch, role/permission version, device, expiry, and revocation epoch.
- The client must deny offline use after expiry, tenant/branch mismatch, device revocation, or permission-version invalidation.
- Offline financial authority must be explicit and bounded. Limits should cover bill value, discount, catalog age, permitted methods, maximum offline age, and whether due collection is allowed.
- Offline due collection requires a separately designed balance lease or reservation protocol. Refund approval and payout remain online-only until an equally strong authority model is approved.

## Local operation log and synchronization

- Every local mutation is written first to an immutable SQLite outbox in the same transaction as its local projection.
- Each envelope has a stable operation ID, schema version, tenant and device identity, actor, business time, creation time, prior aggregate version where applicable, and a canonical payload hash.
- Retries reuse the same operation ID and identical payload. A changed payload under an existing identity is a hard conflict.
- The cloud inbox stores the operation and durable acknowledgement atomically with the resulting ledger change. A client deletes or archives an outbox entry only after that acknowledgement is durable locally.
- Aggregate versions and ordering rules must make concurrent edits visible. Financial conflicts are never resolved with last-write-wins.
- Protocol evolution must be versioned and backward compatible across the supported client upgrade window.

## Reusable Phase 2 foundations

- Money, discount allocation, canonical hashing, and request validation live outside HTTP handlers.
- Posted bills preserve patient, test, price, doctor, referral, discount, and tenant snapshots for deterministic receipts.
- Public operation IDs and tenant-scoped idempotency do not depend on database sequence numbers.
- Collections, cancellations, and refunds share a locked financial aggregate boundary.

These foundations reduce later extraction work, but the current server services still use PostgreSQL transactions and locks. A storage-neutral application layer and SQLite adapters are future work.

## Recovery requirements

- Encrypt SQLite at rest and protect device keys with the operating-system credential store.
- Provide verified backup/restore with tenant, branch, device, schema-version, and outbox-watermark checks.
- Detect corruption before opening for billing; preserve a support-exportable, encrypted outbox when recovery is required.
- Make synchronization replay-safe after crashes at every point between local commit, cloud commit, acknowledgement, and local acknowledgement persistence.
- Record clock skew and use server acknowledgement time for authoritative posting order; never silently rewrite the user's captured business time.
- Provide activation transfer and device-loss procedures that revoke the former device before a replacement gains financial authority.

## Proposed delivery sequence

1. Extract storage-neutral command contracts and deterministic financial calculations from the cloud service.
2. Define the versioned operation-envelope and acknowledgement protocol, then run compatibility tests against PostgreSQL and SQLite adapters.
3. Implement device activation, protected keys, revocation, and bounded offline login grants.
4. Add the encrypted SQLite projection/outbox and crash-recovery test suite.
5. Pilot offline bill creation under low, explicit limits; keep due collection and refunds online.
6. Design and threat-model balance leases before enabling offline due collection.
7. Add operational backup, restore, re-provisioning, observability, and reconciliation tooling before production rollout.

