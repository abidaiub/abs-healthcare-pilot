# Customer-pilot operator guide

## Start of shift

1. Confirm Windows date/time is correct, the approved printer is online with the right paper, and the client shows the expected branch and user.
2. Read the five states separately: network, cloud reachability, device authorization, pending synchronization, and conflicts.
3. If online, synchronize before posting. If conflicts/quarantine exist, stop and contact support; do not re-enter the same bill.

## New bill

1. Search for the patient first. Create a patient only when the identity is genuinely new; never guess or merge duplicates.
2. Select tests from the authorized local catalog and verify quantities, prices, delivery time, discounts, and payment method.
3. For a partial payment, read net, paid, and due back to the customer. “Recorded” payment is not gateway confirmation.
4. Post once. Record the stable local receipt number. If printing fails, use reprint; never post another bill.
5. Use **Hold draft** when entry is incomplete; resume and review it before posting.

## Offline operation

Offline mode permits provisioned login, patient/new bill, initial collection, receipt/reprint, local report, and refund/cancellation request capture within the valid lease. Due collection and actual cancellation/refund posting are online-only. If the lease expires or clock rollback is reported, stop new billing, correct Windows time through authorized support, reconnect, and refresh authorization. Never change time to bypass a lease.

## Synchronization and unknown outcomes

Use **Synchronize now** when connectivity returns. Pending is normal temporarily; conflicted/quarantined is not. After a timeout, do not create a replacement bill/payment. Record the operation/receipt and let support retry/reconcile the same identity. A revoked device must stop billing immediately; retain it for evidence and contact support.

## Printing and reports

Confirm patient, receipt, tests, gross, discount, net, paid, and due before handing over paper. Reprint must show the same identity. Local reports cover this device/branch and explicitly exclude cloud-only activity; use the cloud report for consolidated reconciliation.

## Backup and incidents

At the approved interval, stop posting briefly, synchronize if possible, create an encrypted backup, record its hash, and place it only in approved custody. Do not email or copy databases to personal drives. On disk-full, database, migration, lost-device, suspected compromise, or persistent conflict: stop posting, preserve the PC and messages, and contact support. Never delete/reset/rename the database, copy a device identity to another PC, or uninstall as a sync fix.

## End of shift

Synchronize; confirm pending/conflict counts; reconcile local collections and receipts; complete the backup schedule; record printer/network incidents; sign out. Escalate any unexplained difference before the next shift.

## Acceptance sign-off

Operator and observer must record whether each checklist case was completed without coaching, whether terminology was understood, time to complete common workflows, observed errors/workarounds, accessibility/language concerns, receipt readability, and reconciliation accuracy. Site manager and product owner approve or reject pilot entry.
