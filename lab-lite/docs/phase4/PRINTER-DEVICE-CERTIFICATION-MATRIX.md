# Printer and device certification matrix

No format is certified until a human compares physical output with cloud and local records, signs the row, and attaches photographs/scans with identifiers redacted. Browser/PDF preview is not physical certification.

## Current host inventory and status

| Format/device | Detected hardware | Driver/port | Physical result | Status | Required evidence |
|---|---|---|---|---|---|
| A4 | Brother HL-L2360D series | Microsoft IPP / WSD; redirected Easy Print instance also present | Not printed or inspected | NOT RUN — BLOCKER | Patient copy and office copy; totals, margins, page break, logo/font, reprint, offline print, 20-page batch |
| A5 | Brother HL-L2360D series | Same as above | Hardware paper/tray capability not confirmed | NOT RUN — BLOCKER | Correct paper selection, scaling 100%, margins, no clipping, duplex disabled unless approved |
| 80mm thermal | None detected | N/A | Not available | NOT RUN — BLOCKER | Exact model/driver/USB or LAN port, roll width, text density, logo, QR/barcode if used, five cuts, reprint |
| 58mm thermal | None detected | N/A | Not available | NOT RUN — BLOCKER | Exact model/driver/port, margins, wrapping, totals, ten consecutive receipts |
| Cutter | None detected | N/A | Not available | NOT RUN | Partial/full cut behavior, failure recovery, no duplicate bill |
| Cash drawer | None detected | N/A | Not available | NOT RUN | Approved trigger only after recorded collection; no trigger on preview/reprint/failure |
| PDF/XPS virtual output | Microsoft PDF and XPS detected | Virtual | Not used as substitute | NOT CERTIFICATION | May be retained only as layout evidence |

## Per-device acceptance record

Record manufacturer, model, serial/asset tag, firmware, driver name/version, connection, Windows device name, paper stock, DPI, cutter/drawer configuration, test date, app version/hash, operator, observer, and evidence paths. Test offline preview/print, reprint, print failure/retry, Unicode names, long test names, maximum lines, zero/partial/full payment, local/cloud references, duplicate prevention, and power-cycle recovery.
