from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs/Business-Journey/evidence/J-00-User-Management"
OUT = ROOT / "docs/Operational-Journey-Book/Volume-00/Tenant-Onboarding-and-User-Management-Tutorial.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
NAVY = colors.HexColor("#12304A")
TEAL = colors.HexColor("#0F766E")
PALE = colors.HexColor("#EAF4F4")
INK = colors.HexColor("#243443")
MUTED = colors.HexColor("#5F6F7D")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=27, leading=32, textColor=colors.white, alignment=TA_CENTER, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=18, textColor=colors.HexColor("#D9EAF1"), alignment=TA_CENTER))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=TEAL, spaceBefore=7, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.3, leading=13.4, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.5, leading=10.5, textColor=MUTED))
styles.add(ParagraphStyle(name="Callout", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=NAVY, backColor=PALE, borderColor=TEAL, borderWidth=0.7, borderPadding=8, spaceBefore=5, spaceAfter=8))


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(16 * mm, PAGE_H - 9 * mm, "ABSHealthcareLite | Operational Journey Book | Volume 00")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(16 * mm, 9 * mm, "Tenant Onboarding + Operational User Management | Browser UAT 2026-08-02")
    canvas.drawRightString(PAGE_W - 16 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def screenshot(name, caption):
    path = EVIDENCE / name
    img = Image(str(path))
    max_w, max_h = 176 * mm, 101 * mm
    scale = min(max_w / img.imageWidth, max_h / img.imageHeight)
    img.drawWidth = img.imageWidth * scale
    img.drawHeight = img.imageHeight * scale
    return KeepTogether([img, Spacer(1, 2 * mm), Paragraph(caption, styles["Smallx"])])


doc = BaseDocTemplate(str(OUT), pagesize=A4, rightMargin=16*mm, leftMargin=16*mm, topMargin=21*mm, bottomMargin=16*mm, title="Tenant Onboarding and User Management Tutorial", author="ABSHealthcareLite")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates(PageTemplate(id="main", frames=frame, onPage=header_footer))
story = []

# Cover
story += [Spacer(1, 30*mm), Table([[Paragraph("ABSHealthcareLite", styles["CoverSub"])], [Paragraph("Tenant Onboarding<br/>+ Operational User Management", styles["CoverTitle"])], [Paragraph("Browser UAT Tutorial and Screenshot Evidence", styles["CoverSub"])], [Paragraph("Doctors Point Diagnostic Center (DPDC)<br/>Bhola Main Branch | BR-BHL-01", styles["CoverSub"])]], colWidths=[178*mm], rowHeights=[14*mm, 58*mm, 18*mm, 31*mm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),NAVY),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),1,TEAL)])), Spacer(1,10*mm), Paragraph("UAT date: 02 August 2026 | Evidence set: 34 browser screenshots | Classification: Operator tutorial", styles["Callout"]), Paragraph("This publication uses only live browser evidence. Production-like DPDC company, branch, staff, doctor, and schedule records were verified without alteration. A dedicated UAT account was used for lifecycle tests.", styles["Bodyx"]), PageBreak()]

story += [Paragraph("1. Outcome at a glance", styles["H1x"]), Paragraph("The tenant onboarding and user-management journey passed. The readiness engine independently returned <b>100%</b>, <b>READY_FOR_FIRST_PATIENT</b>, and <b>Can declare: true</b>.", styles["Callout"])]
data = [["Control", "Observed result"], ["Tenant context", "DPDC / BR-BHL-01"], ["Operational users", "19 active users cover required roles"], ["Doctors & schedules", "3 doctors; 1 verifier; 2 with published schedules"], ["Diagnostic readiness", "15 services, 21 ranges, 4 mapped analyzers, 4 LIS connections"], ["Portal & notifications", "Enabled and green"], ["Security", "Inactive login denied; Reception blocked from user management"]]
story += [Table(data, colWidths=[48*mm,128*mm], repeatRows=1, style=TableStyle([("BACKGROUND",(0,0),(-1,0),NAVY),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.35,colors.HexColor('#B8C7D1')),("VALIGN",(0,0),(-1,-1),"TOP"),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor('#F4F8FA')]),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)])), Spacer(1,5*mm), screenshot("32-readiness-dashboard.png", "Screen 32 — Operational Readiness dashboard."), PageBreak()]

story += [Paragraph("2. Sign in with the correct tenant context", styles["H1x"]), Paragraph("Select Doctors Point Diagnostic Center (DPDC), then Bhola Main Branch (BR-BHL-01). After sign-in, confirm the tenant, branch, username, and Tenant Administrator role in the banner before changing configuration.", styles["Bodyx"]), screenshot("01-tenant-admin-login.png", "Screen 01 — Staff sign-in surface; any retained password value is masked."), Spacer(1,4*mm), screenshot("02-tenant-dashboard.png", "Screen 02 — Authenticated DPDC tenant-admin workspace and branch context."), PageBreak()]

story += [Paragraph("3. Verify the organizational foundation", styles["H1x"]), Paragraph("Company contact and branding must be complete. The intended branch must be active. Required departments must cover reception, billing/cash, collection, laboratory sections, result entry, verification, and delivery.", styles["Bodyx"]), screenshot("03-company-profile.png", "Screen 03 — Company profile and branding."), Spacer(1,4*mm), screenshot("09-departments-ready.png", "Screen 09 — Department coverage for operations."), PageBreak()]

story += [Paragraph("4. Roles and least privilege", styles["H1x"]), Paragraph("Review the tenant role catalogue and permission surface before assigning staff. Automated RBAC verification passed 16/16 checks. Reception cannot manage users; Tenant Administrator cannot clinically verify or release; Report Delivery cannot verify.", styles["Bodyx"]), screenshot("10-role-list.png", "Screen 10 — Tenant role catalogue."), Spacer(1,4*mm), screenshot("11-role-permissions.png", "Screen 11 — Role and permission management surface."), PageBreak()]

story += [Paragraph("5. Create and assign operational users", styles["H1x"]), Paragraph("Enter username, contact details, temporary password, primary role, department, and branch. Enable forced password change for a new user. Use one account per person and apply least privilege.", styles["Bodyx"]), screenshot("12-user-wizard.png", "Screen 12 — Create-user form and assignment controls."), Spacer(1,4*mm), screenshot("20-user-list-complete.png", "Screen 20 — Existing DPDC operational user coverage."), PageBreak()]

story += [Paragraph("6. Lifecycle controls", styles["H1x"]), Paragraph("Lifecycle testing used only the dedicated account dp.uat.user.mgmt. The edit page exposes role, branch, status, force-password-change, and reset-password controls.", styles["Bodyx"]), screenshot("21-user-edit-role-branch.png", "Screen 21 — Dedicated UAT account edit surface."), Spacer(1,4*mm), screenshot("22-user-deactivated.png", "Screen 22 — Account status set to Inactive."), PageBreak()]

story += [Paragraph("7. Deny inactive login; restore active access", styles["H1x"]), Paragraph("An inactive account was rejected with a generic Invalid username or password message, avoiding account-status disclosure. The account was then restored to Active and could sign in. When the Reception user opened /settings/users directly, the server redirected to /dashboard?error=insufficient-permission.", styles["Callout"]), screenshot("23-login-denied.png", "Screen 23 — Inactive user login denied; password remains masked."), PageBreak(), Paragraph("Access restored", styles["H1x"]), Paragraph("After the status returned to Active, the dedicated UAT account could authenticate. Its Reception role still could not open tenant user management.", styles["Bodyx"]), screenshot("25-user-reactivated.png", "Screen 25 — Dedicated UAT account reactivated."), PageBreak()]

story += [Paragraph("8. Doctors, schedules, and appointments", styles["H1x"]), Paragraph("Verify at least one active verification doctor and published schedules. Published doctors must be offered by the appointment workflow. Existing DPDC doctor and schedule records were inspected only.", styles["Bodyx"]), screenshot("28-verification-doctor.png", "Screen 28 — Existing verification doctor."), Spacer(1,4*mm), screenshot("31-doctor-available-in-appointment.png", "Screen 31 — Published doctor available to appointment booking."), PageBreak()]

story += [Paragraph("9. Readiness and verification record", styles["H1x"]), Paragraph("Do not declare operational readiness until every rule is green. The UI and independent database verifier agreed on the final state.", styles["Bodyx"]), screenshot("34-ready-for-first-patient.png", "Screen 34 — READY FOR FIRST PATIENT."), Spacer(1,4*mm)]
verify = [["Verification", "Result"], ["Browser evidence", "34/34 captured"], ["verify:mod00", "PASS — 100%, READY_FOR_FIRST_PATIENT"], ["verify:mod02", "PASS — 16/16"], ["verify:mod07", "PASS"], ["verify:dpdc", "PASS"]]
story += [Table(verify, colWidths=[50*mm,126*mm], style=TableStyle([("BACKGROUND",(0,0),(-1,0),TEAL),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.35,colors.HexColor('#B8C7D1')),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor('#F4F8FA')]),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)])), PageBreak()]

story += [Paragraph("10. Known gaps and operator checklist", styles["H1x"]), Paragraph("Known gaps", styles["H2x"]), Paragraph("1. Department assignment is available during creation but not on the user edit page.<br/>2. DPDC has one branch, so cross-branch reassignment could not be tested without inventing operational data.<br/>3. Password reset has no visible success receipt or audit reference on the edit page.", styles["Callout"]), Paragraph("Before go-live", styles["H2x"]), Paragraph("Confirm tenant and branch context; complete company branding; verify the active/default branch; verify required departments and roles; give every user a least-privilege role and active branch; require temporary-password change; confirm inactive login is denied; confirm operational users cannot open tenant administration; verify the verification doctor and published schedule; require 100% readiness; never capture passwords.", styles["Bodyx"]), Spacer(1,8*mm), Paragraph("Bilingual companion", styles["H2x"]), Paragraph("The complete English and Bangla operator tutorial, plus the 34-screen evidence index, is maintained in docs/Business-Journey/J-00-Tenant-Onboarding-and-User-Management.md.", styles["Bodyx"])]

doc.build(story)
print(OUT)
