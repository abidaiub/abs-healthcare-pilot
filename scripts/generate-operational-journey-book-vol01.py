from pathlib import Path
from textwrap import wrap

from PIL import Image as PILImage
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "Business-Journey" / "evidence"
OUT_DIR = ROOT / "docs" / "Operational-Journey-Book" / "Volume-01"
OUT = OUT_DIR / "OperationalJourneyBook_Vol01.pdf"

NAVY = HexColor("#12304A")
TEAL = HexColor("#0F8B8D")
GREEN = HexColor("#2E7D5A")
GOLD = HexColor("#D9A441")
INK = HexColor("#243444")
MUTED = HexColor("#617487")
PALE = HexColor("#F2F7F8")
LINE = HexColor("#D6E1E6")
W, H = A4


def shot(part, filename, title, chapter, actor, route, goal, response, modules, evidence_id, qc="PASS"):
    return {
        "path": EVIDENCE / f"J-01-Part-{part}" / filename,
        "title": title,
        "chapter": chapter,
        "actor": actor,
        "route": route,
        "goal": goal,
        "response": response,
        "modules": modules,
        "evidence": evidence_id,
        "qc": qc,
    }


chapters = [
    (1, "Doctors Point Diagnostic Center", "One centre, one branch, one continuous patient story.", []),
    (2, "Tenant Deployment and Operational Readiness", "Governed configuration creates a safe operating foundation.", []),
    (3, "Reception", "A fictional visitor becomes a safe, searchable patient identity.", [
        shot(1,"01-reception-login.png","Reception signs in",3,"Receptionist","/login","Enter the correct tenant and branch workspace.","DPDC and BR-BHL-01 context loaded for reception.","MOD-01, MOD-07","J01-P1-01"),
        shot(1,"03-patient-created-success.png","Patient created",3,"Receptionist","/patients/new","Create one auditable patient record.","PT-000009 was issued to Nusrat Jahan.","MOD-15","J01-P1-03"),
        shot(1,"04-patient-profile.png","Identity confirmed",3,"Receptionist","/patients/{patientId}","Confirm the saved demographic identity.","The patient profile displayed the saved identity and DOB.","MOD-15","J01-P1-04"),
    ]),
    (4, "Appointment and Queue", "The scheduled visit becomes a live clinical hand-off.", [
        shot(1,"05-appointment-created.png","Appointment booked",4,"Receptionist","/appointments/new","Reserve the correct doctor and time.","AP-000005 was created for Dr. Kamrul Hasan.","MOD-17","J01-P1-05"),
        shot(1,"07-patient-checked-in.png","Patient arrives",4,"Receptionist","/appointments/{id}","Move the patient into the active queue.","The appointment changed to checked-in.","MOD-17","J01-P1-07"),
        shot(1,"08-doctor-worklist-entry.png","Doctor sees the patient",4,"Doctor","/consultations","Expose only the assigned clinical work item.","PT-000009 appeared in the doctor's worklist.","MOD-17, MOD-18","J01-P1-08"),
    ]),
    (5, "Consultation", "Clinical intent becomes a finalized, reusable prescription.", [
        shot(1,"10-consultation-open.png","Encounter opened",5,"Dr. Kamrul Hasan","/consultations/{encounterId}","Start the consultation on the existing appointment.","EN-000004 opened against AP-000005.","MOD-18","J01-P1-10"),
        shot(1,"11-clinical-notes.png","Clinical notes recorded",5,"Dr. Kamrul Hasan","Consultation workspace","Capture the fictional UAT assessment and advice.","Structured encounter notes were saved.","MOD-18","J01-P1-11"),
        shot(1,"12-investigations-added.png","Investigations selected",5,"Dr. Kamrul Hasan","Consultation workspace","Request CBC, TSH and Free T4.","Three diagnostic investigations were linked to the encounter.","MOD-18, MOD-19","J01-P1-12"),
        shot(1,"13-prescription-finalized.png","Prescription v1 finalized",5,"Dr. Kamrul Hasan","/prescriptions/{id}","Lock the original clinical order.","RX-000004 v1 became finalized and immutable.","MOD-19","J01-P1-13"),
        shot(1,"14-prescription-print-preview.png","Prescription preview",5,"Dr. Kamrul Hasan","/prescriptions/{id}/print","Confirm the printable clinical document.","Patient, doctor and all three investigations appeared.","MOD-19","J01-P1-14"),
    ]),
    (6, "Billing", "Transparent pricing and payment clear the way for diagnostics.", [
        shot(1,"15-billing-prescription-loaded.png","Prescription loaded into billing",6,"Billing Officer","/diagnostic/billing","Avoid re-keying the doctor's investigations.","RX-000004 supplied all three invoice lines.","MOD-10, MOD-19","J01-P1-15"),
        shot(1,"17-discount-applied.png","Discount controlled",6,"Billing Officer","Billing workspace","Apply the approved BDT 125 discount.","The payable total recalculated to BDT 2,375.","MOD-10","J01-P1-17"),
        shot(1,"18-full-payment.png","Payment collected",6,"Cash Officer","Invoice payment","Settle the full payable amount.","The payment posted with no remaining due.","MOD-10","J01-P1-18"),
        shot(1,"19-invoice-paid.png","Invoice cleared",6,"Cash Officer","/diagnostic/billing/{invoiceId}","Confirm financial eligibility for the laboratory.","INV-000004 displayed PAID and due 0.","MOD-10","J01-P1-19"),
        shot(1,"20-cash-memo.png","Cash memo issued",6,"Cash Officer","Cash memo print","Give the patient a clear payment record.","RCP-000006 showed the settled transaction.","MOD-10","J01-P1-20"),
    ]),
    (7, "Collection", "Correct containers and labels protect the sample identity.", [
        shot(1,"23-accessions-generated.png","Accessions generated",7,"Billing / Laboratory","Lab order confirmation","Turn the paid order into traceable specimens.","ACC-000011 and ACC-000012 were created.","MOD-21","J01-P1-23"),
        shot(1,"24-collection-worklist.png","Collection worklist",7,"Collection Officer","/lab/collection","Find the right patient and order.","LAB-000004 appeared ready for collection.","MOD-21","J01-P1-24"),
        shot(1,"25-required-containers.png","Containers determined",7,"Collection Officer","Collection detail","Match tests to EDTA and serum containers.","CBC and thyroid tests were separated correctly.","MOD-21","J01-P1-25"),
        shot(1,"26-edta-label.png","EDTA label",7,"Collection Officer","Label print","Create a barcode label for the CBC tube.","The EDTA label carried the correct accession identity.","MOD-21","J01-P1-26"),
        shot(1,"27-serum-label.png","Serum label",7,"Collection Officer","Label print","Create a barcode label for the thyroid tube.","The serum label carried the second accession.","MOD-21","J01-P1-27"),
        shot(1,"29-all-samples-collected.png","Collection completed",7,"Collection Officer","Collection detail","Record both physical collections.","Both specimens were collected without duplication.","MOD-21","J01-P1-29"),
        shot(1,"30-lab-order-collected.png","Order status confirmed",7,"Collection Officer","Lab order detail","Close the collection hand-off.","LAB-000004 displayed Collected.","MOD-21","J01-P1-30"),
    ]),
    (8, "Laboratory", "Samples travel through controlled receipt, routing and LIS stages.", [
        shot(2,"01-receipt-worklist.png","Receipt queue",8,"Collection Officer","/lab/receipt","Confirm laboratory custody of both samples.","Both accessions matched PT-000009 and LAB-000004.","MOD-21","J01-P2-01"),
        shot(2,"07-haematology-processing-worklist.png","Department routing",8,"Haematology Technologist","/lab/processing","Route EDTA to the correct section.","ACC-000011 appeared in Haematology.","MOD-21","J01-P2-07"),
        shot(2,"12-lis-worklist.png","LIS worklist",8,"Result Entry Technologist","/lab/lis-worklist","Receive analyzer messages with traceable control IDs.","The LIS queue exposed imports and their audit trail.","MOD-22","J01-P2-12"),
        shot(2,"14-cbc-results-imported.png","CBC imported",8,"Result Entry Technologist","LIS worklist","Attach analyzer values to ACC-000011.","CBC results imported successfully.","MOD-22","J01-P2-14"),
        shot(2,"16-tsh-ft4-results-imported.png","Thyroid results imported",8,"Result Entry Technologist","LIS worklist","Attach TSH and Free T4 to ACC-000012.","Both thyroid results imported successfully.","MOD-22","J01-P2-16"),
        shot(2,"17-abnormal-tsh-flag.png","Abnormal result identified",8,"Result Entry Technologist","Result detail","Make the clinical exception unmistakable.","TSH 6.80 mIU/L was flagged HIGH against 0.4-4.","MOD-22","J01-P2-17"),
        shot(2,"18-lis-audit-evidence.png","Duplicate protected",8,"Result Entry Technologist","LIS audit","Prevent the same analyzer message being processed twice.","The duplicate control ID was blocked while the original remained audited.","MOD-22","J01-P2-18"),
        shot(2,"20-cbc-result-review.png","Normal CBC reviewed",8,"Result Entry Technologist","Result detail","Confirm corrected fictional CBC values and flags.","HGB, WBC and platelets displayed NORMAL.","MOD-22","J01-P2-20"),
        shot(2,"21b-free-t4-result-review.png","Normal Free T4 reviewed",8,"Result Entry Technologist","Result detail","Compare the second thyroid result with its range.","Free T4 1.2 ng/dL displayed NORMAL.","MOD-22","J01-P2-21B"),
        shot(2,"25-unauthorized-edit-blocked.png","LIS result protected",8,"Result Entry Technologist","Result editor","Block unauthorized override of analyzer data.","The system returned LAB_LIS_OVERRIDE_NOT_PERMITTED.","MOD-22","J01-P2-25"),
    ]),
    (9, "Verification", "Independent review separates result entry from clinical approval.", [
        shot(2,"26-verification-worklist.png","Verification queue",9,"Verification Doctor","/lab/verification","Present only results ready for independent review.","CBC, TSH and Free T4 were available for verification.","MOD-23","J01-P2-26"),
        shot(2,"28-thyroid-verification.png","Thyroid result reviewed",9,"Verification Doctor","Verification review","Review the HIGH TSH with its version and range.","The verification screen preserved value, flag and context.","MOD-23","J01-P2-28"),
        shot(2,"30-verification-audit.png","Verification audited",9,"Verification Doctor","Verification history","Record who verified what and when.","Attempt 1 displayed VERIFIED with user, time and version.","MOD-23","J01-P2-30"),
    ]),
    (10, "Release", "A financially and clinically eligible result becomes a trusted report.", [
        shot(2,"32-release-eligibility-pass.png","Eligibility passed",10,"Report Delivery Officer","/lab/report-release/{id}","Confirm due 0, no holds and current version.","The report was eligible for authorization.","MOD-24","J01-P2-32"),
        shot(2,"35-reports-released.png","Three reports released",10,"Report Delivery Officer","Release history","Create unique, immutable report identities.","RPT-0000012, 13 and 14 displayed RELEASED.","MOD-24","J01-P2-35"),
        shot(2,"36-report-print-preview.png","Clinical report preview",10,"Report Delivery Officer","Report print","Inspect identity, result, verifier, brand and QR.","The TSH report displayed the complete released artifact.","MOD-24","J01-P2-36"),
        shot(2,"37-report-pdf.png","PDF generated",10,"Report Delivery Officer","Report download","Produce a portable versioned report.","RPT-0000012 downloaded and incremented its audit count.","MOD-24","J01-P2-37"),
        shot(2,"38-report-qr.png","QR created",10,"Report Delivery Officer","Report detail","Bind authenticity to the released version.","A privacy-safe verification token and QR were shown.","MOD-24","J01-P2-38"),
        shot(2,"39-public-qr-verification.png","Public verification",10,"Public verifier","/verify/report/{token}","Confirm authenticity without exposing clinical details.","The public page returned report number, status, version and validity only.","MOD-24","J01-P2-39"),
        shot(2,"40-portal-published.png","Portal publication",10,"Report Delivery Officer","Report portal action","Make all three released reports available to the patient.","Each report received a portal publication timestamp.","MOD-24, MOD-30","J01-P2-40"),
    ]),
    (11, "Patient Portal", "The patient receives only her own released information.", [
        shot(3,"01-portal-login.png","Patient portal login",11,"Nusrat Jahan","/portal/login","Use the patient identity, not a staff account.","The portal accepted the approved patient enrollment.","MOD-30","J01-P3-01"),
        shot(3,"03-my-reports.png","My Reports",11,"Nusrat Jahan","/portal/reports","Show only reports released to PT-000009.","Exactly RPT-0000012, 13 and 14 were visible.","MOD-30, MOD-24","J01-P3-03"),
        shot(3,"07-pdf-download.png","Patient downloads report",11,"Nusrat Jahan","Portal PDF action","Let the patient take the TSH report securely.","A PDF_DOWNLOAD audit was recorded for PORTAL:PT-000009.","MOD-30, MOD-24","J01-P3-07"),
    ]),
    (12, "Doctor Follow-up", "Released evidence becomes version-controlled treatment.", [
        shot(3,"09-follow-up-open.png","Previous prescription opened",12,"Dr. Kamrul Hasan","/prescriptions/{id}","Return to the original encounter and RX v1.","RX-000004 v1 and EN-000004 were visible.","MOD-19","J01-P3-09"),
        shot(3,"10-report-review.png","Released TSH reviewed",12,"Dr. Kamrul Hasan","/lab/report-release/{id}/print","Review the verified abnormal thyroid result.","TSH 6.80 HIGH, verifier and QR were visible.","MOD-24","J01-P3-10"),
        shot(3,"11-rx-version-history.png","Version history before revision",12,"Dr. Kamrul Hasan","Prescription history","Confirm the preserved starting point.","RX-000004 showed v1 as the current finalized version.","MOD-19","J01-P3-11"),
        shot(3,"12-rx-v2.png","Prescription v2 prepared",12,"Dr. Kamrul Hasan","Prescription revision editor","Record fictional treatment and a six-week follow-up.","Levothyroxine 50 mcg OD and 42-day follow-up were saved.","MOD-19","J01-P3-12"),
        shot(3,"13-rx-print.png","Prescription v2 printed",12,"Dr. Kamrul Hasan","/prescriptions/{id}/print","Confirm the finalized patient-facing prescription.","The print showed treatment and repeat TSH instruction.","MOD-19","J01-P3-13"),
        shot(3,"14-version-history.png","Versions preserved",12,"Dr. Kamrul Hasan","Prescription history","Prove the revision did not overwrite the original.","v2 was current/finalized and v1 was superseded.","MOD-19","J01-P3-14"),
    ]),
    (13, "Journey Complete", "Every operational hand-off closes on one patient record.", [
        shot(3,"16-journey-complete.png","Operational closure",13,"Patient and care team","Prescription history","Close the first-patient story with treatment completed.","The current v2 and preserved v1 provided the final auditable state.","J-01","J01-P3-16"),
    ]),
]

# Four full-page LIS captures are preserved in the source evidence set but are
# too tall to remain legible when fitted uncropped on A4 portrait. Their proven
# outcomes are represented by the adjacent readable result and audit screens.
UNREADABLE_ON_A4 = {"J01-P2-12", "J01-P2-14", "J01-P2-16", "J01-P2-18"}
chapters = [
    (number, title, subtitle, [item for item in screenshots if item["evidence"] not in UNREADABLE_ON_A4])
    for number, title, subtitle, screenshots in chapters
]


def lines(text, width=82):
    return wrap(text, width=width, break_long_words=False) or [""]


def draw_header_footer(c, page, section="Operational Journey Book"):
    c.setStrokeColor(LINE)
    c.line(42, H - 33, W - 42, H - 33)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(42, H - 25, "ABSHealthcareLite")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 42, H - 25, section)
    c.line(42, 30, W - 42, 30)
    c.setFillColor(MUTED)
    c.drawString(42, 18, "Doctors Point Diagnostic Center - Browser Proven")
    c.drawRightString(W - 42, 18, f"Volume 01  |  {page}")


def page_title(c, kicker, title, subtitle=None):
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(42, H - 63, kicker.upper())
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 23)
    c.drawString(42, H - 91, title)
    if subtitle:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 10)
        c.drawString(42, H - 108, subtitle)


def draw_wrapped(c, text, x, y, max_chars, font="Helvetica", size=9, leading=12, color=INK):
    c.setFillColor(color)
    c.setFont(font, size)
    for line in lines(text, max_chars):
        c.drawString(x, y, line)
        y -= leading
    return y


def cover(c):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.rect(0, H - 18, W, 18, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(42, H - 175, 72, 5, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(42, H - 92, "ABSHealthcareLite")
    c.setFont("Helvetica-Bold", 31)
    c.drawString(42, H - 225, "Operational Journey Book")
    c.setFont("Helvetica", 17)
    c.drawString(42, H - 258, "Volume 01")
    c.setFont("Helvetica-Bold", 28)
    c.drawString(42, H - 320, "The First Patient")
    c.setFillColor(HexColor("#B9D9DA"))
    c.setFont("Helvetica", 16)
    c.drawString(42, H - 358, "From Tenant Deployment")
    c.drawString(42, H - 382, "to Successful Treatment")
    c.setFillColor(GOLD)
    c.roundRect(42, H - 475, 235, 45, 5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(58, H - 457, "BROWSER PROVEN  |  EVIDENCE DRIVEN")
    c.setFillColor(white)
    c.setFont("Helvetica", 11)
    c.drawString(42, 76, "Doctors Point Diagnostic Center - Bhola Main Branch")
    c.setFillColor(HexColor("#8CB7B8"))
    c.drawString(42, 56, "Official J-01 Evidence Book  |  2026")


def narrative_page(c, page, title, paragraphs, section="Front Matter"):
    draw_header_footer(c, page, section)
    page_title(c, section, title)
    y = H - 145
    for p in paragraphs:
        y = draw_wrapped(c, p, 55, y, 92, size=11, leading=17)
        y -= 14


def chapter_page(c, page, number, title, subtitle):
    c.setFillColor(PALE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.circle(W - 88, H - 110, 46, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(W - 88, H - 119, f"{number:02d}")
    c.setFillColor(GOLD)
    c.rect(42, H - 214, 70, 5, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 27)
    for idx, line in enumerate(lines(title, 30)):
        c.drawString(42, H - 264 - idx * 34, line)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 13)
    y = H - 345
    for line in lines(subtitle, 58):
        c.drawString(42, y, line)
        y -= 19
    if number == 13:
        flow = ["Patient Arrives", "Reception", "Doctor", "Billing", "Collection", "Laboratory", "Verification", "Release", "Portal", "Doctor Follow-up", "Treatment Completed"]
        y = H - 430
        for idx, item in enumerate(flow):
            x = 52 + (idx % 2) * 245
            yy = y - (idx // 2) * 43
            c.setFillColor(white)
            c.roundRect(x, yy, 205, 27, 5, fill=1, stroke=0)
            c.setFillColor(GREEN if idx == len(flow)-1 else NAVY)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(x + 102.5, yy + 9, item)
    draw_header_footer(c, page, f"Chapter {number}")


def screenshot_page(c, page, step_no, data):
    draw_header_footer(c, page, f"Chapter {data['chapter']}")
    page_title(c, f"Step {step_no:02d}", data["title"], f"Evidence {data['evidence']}  |  QC {data['qc']}")
    image_top = H - 128
    image_bottom = 265
    image_left = 42
    image_right = W - 42
    with PILImage.open(data["path"]) as im:
        iw, ih = im.size
    max_w = image_right - image_left
    max_h = image_top - image_bottom
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    x = image_left + (max_w - dw) / 2
    y = image_bottom + (max_h - dh) / 2
    c.setFillColor(white)
    c.setStrokeColor(LINE)
    c.roundRect(image_left - 5, image_bottom - 5, max_w + 10, max_h + 10, 6, fill=1, stroke=1)
    c.drawImage(str(data["path"]), x, y, width=dw, height=dh, preserveAspectRatio=True, mask="auto")
    c.setFillColor(PALE)
    c.roundRect(42, 52, W - 84, 191, 7, fill=1, stroke=0)
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 226, "BUSINESS GOAL")
    draw_wrapped(c, data["goal"], 55, 211, 78, size=9, leading=11)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 177, "WHO / WHERE")
    draw_wrapped(c, f"{data['actor']}  |  {data['route']}", 55, 162, 78, size=9, leading=11)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 128, "SYSTEM RESPONSE")
    draw_wrapped(c, data["response"], 55, 113, 78, size=9, leading=11)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(55, 77, f"MODULES  {data['modules']}     |     BROWSER UAT  {data['qc']}     |     EVIDENCE  {data['evidence']}")


def appendix_page(c, page, title, bullets):
    draw_header_footer(c, page, "Appendix")
    page_title(c, "Appendix", title)
    y = H - 150
    for heading, body in bullets:
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(55, y, heading)
        y -= 18
        y = draw_wrapped(c, body, 70, y, 88, size=10, leading=14)
        y -= 18


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    missing = [str(s["path"]) for _, _, _, shots in chapters for s in shots if not s["path"].exists()]
    if missing:
        raise FileNotFoundError("Missing evidence:\n" + "\n".join(missing))
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("ABSHealthcareLite Operational Journey Book - Volume 01")
    c.setAuthor("ABSHealthcareLite / Al Baraka Soft")
    page = 1
    cover(c); c.showPage(); page += 1
    narrative_page(c,page,"Foreword",[
        "Healthcare operations succeed at the hand-offs. This book follows one fictional patient through every hand-off at Doctors Point Diagnostic Center - Bhola Main Branch.",
        "The story is deliberately visual. Each screen answers what happened, who acted, why the action mattered, and how ABSHealthcareLite responded. Every image comes from the completed J-01 browser journey.",
        "The result is more than a demo: it is an evidence chain for onboarding, sales, quality review, training and future operational design."
    ]); c.showPage(); page += 1
    narrative_page(c,page,"Journey Summary",[
        "Nusrat Jahan registered as PT-000009, attended AP-000005, completed encounter EN-000004 and received RX-000004.",
        "INV-000004 was paid in full. LAB-000004 produced two accessions, three verified results and three released reports: RPT-0000012, RPT-0000013 and RPT-0000014.",
        "The patient downloaded the released TSH report, returned to the doctor and received RX-000004 v2. Version 1 remained preserved as superseded."
    ]); c.showPage(); page += 1
    # TOC pages with calculated divider starts.
    starts = []
    pcalc = 6
    for num, title, _, shots in chapters:
        starts.append((num, title, pcalc))
        pcalc += 1 + len(shots)
    for toc_part in range(2):
        draw_header_footer(c,page,"Contents")
        page_title(c,"Navigation","Table of Contents",f"Part {toc_part + 1} of 2")
        y = H - 145
        subset = starts[toc_part*7:(toc_part+1)*7]
        for num, title, pno in subset:
            c.setFillColor(TEAL)
            c.setFont("Helvetica-Bold",10)
            c.drawString(55,y,f"{num:02d}")
            c.setFillColor(INK)
            c.setFont("Helvetica",11)
            c.drawString(85,y,title)
            c.setStrokeColor(LINE)
            c.line(85,y-5,W-72,y-5)
            c.setFillColor(NAVY)
            c.setFont("Helvetica-Bold",10)
            c.drawRightString(W-55,y,str(pno))
            y -= 48
        c.showPage(); page += 1
    step_no = 1
    for num, title, subtitle, shots in chapters:
        chapter_page(c,page,num,title,subtitle); c.showPage(); page += 1
        if num == 1:
            narrative_page(c,page,"The Business Story",[
                "Doctors Point Diagnostic Center operates one continuous diagnostic journey at BR-BHL-01. Reception, doctors, billing, collection, laboratory, verification and report delivery share one governed patient record.",
                "J-01 proves the centre can move from arrival to treatment without losing identity, financial status, specimen traceability, result provenance or prescription history."
            ],"Chapter 1"); c.showPage(); page += 1
        if num == 2:
            narrative_page(c,page,"Operational Readiness",[
                "J-01 began only after the DPDC tenant, subscription, branch, departments, doctors, users, roles, price list, reference ranges, analyzer/LIS controls and portal capability were available in the verified environment.",
                "The journey did not capture dedicated setup screenshots for each configuration screen. This chapter therefore records the proven readiness outcome without inventing deployment imagery. The DPDC regression verifier confirms the configured tenant, branch, roles, departments, locale, currency and module migrations."
            ],"Chapter 2"); c.showPage(); page += 1
        for data in shots:
            screenshot_page(c,page,step_no,data); c.showPage(); page += 1; step_no += 1
    appendices = [
        ("Browser UAT Summary",[("Verdict","PASS after corrective fixes. The complete journey was exercised in the in-app browser against DPDC / BR-BHL-01."),("Continuous records","PT-000009, AP-000005, EN-000004, RX-000004, INV-000004 and LAB-000004 remained the operational backbone."),("Evidence","49 readable selected images in this volume; 91 original captures remain in the three evidence directories.")]),
        ("AI QC and Regression",[("Automated checks","verify:dpdc, verify:mod19, verify:mod24, the Part 3 state verifier and changed-file lint passed."),("Read-only proof","Portal isolation, PDF access audit, report publication and prescription version state were confirmed without database mutation."),("Build caveat","The repository-wide build reaches type checking but is blocked by the unrelated temporary script scripts/tmp-case3-status.ts importing PrismaClient from @prisma/client.")]),
        ("Defects and Fixes",[("Part 1","DOB persistence, server/client mapping and timezone issues were corrected; the cancelled pre-fix appointment remains auditable."),("Part 2","The first fictional CBC analyzer payload used the wrong count scale. Safety flags worked; a second audited message corrected WBC and platelet values."),("Part 3","The patient lacked portal enrollment at baseline. Approved tenant-admin counter enrollment resolved the configuration gap without direct DB editing.")]),
        ("Modules and Lessons",[("Coverage","Authentication, tenant/branch, patient, appointment, consultation, prescription, billing, collection, LIS, result entry, verification, release, notification and portal."),("Lesson","Operational readiness includes portal enrollment, not only report publication."),("Lesson","Analyzer units and reference ranges must be aligned before result submission."),("Lesson","Immutable clinical revisions make follow-up safer and easier to audit.")]),
        ("Known Limitations and Next Journeys",[("Limitations","No notification-outbox UI, patient-facing access-audit UI or dedicated Journey Complete entity. Some laboratory localization keys remain incomplete."),("Clinical boundary","All patient, result, diagnosis and treatment content in this book is fictional UAT data, not medical advice."),("Future journeys","Emergency care, inpatient admission, pharmacy dispensing, imaging, corporate billing and referral workflows should receive their own evidence books rather than extending J-01.")]),
    ]
    for title, bullets in appendices:
        appendix_page(c,page,title,bullets); c.showPage(); page += 1
    c.save()
    print(f"{OUT}|pages={page-1}|screenshots={sum(len(s) for _,_,_,s in chapters)}")


if __name__ == "__main__":
    build()
