import type { SessionContext } from "@/lib/session";

import { isHostSession } from "@/lib/session";



export type NavItem = {

  href: string;

  labelKey: string;

  icon: string;

};



export type NavGroup = {

  titleKey: string;

  items: NavItem[];

};



export const TENANT_PRIMARY_ROLES = [

  "Tenant Admin",

  "Reception",

  "Billing",

  "Lab Technician",

  "Doctor",

  "Report Delivery",

  "Patient Portal",

] as const;



const HOST_NAV: NavGroup[] = [

  {

    titleKey: "groups.hostConsole",

    items: [

      { href: "/host/dashboard", labelKey: "hostDashboard", icon: "◉" },
      { href: "/host/tenants", labelKey: "tenantManagement", icon: "◇" },
      { href: "/host/subscription-packages", labelKey: "subscriptionPackages", icon: "◆" },
      { href: "/host/modules", labelKey: "moduleRegistry", icon: "▦" },
      { href: "/host/audit", labelKey: "hostAuditLog", icon: "◎" },
      { href: "/host/catalog", labelKey: "hostTestCatalog", icon: "◈" },
      { href: "/host/settings", labelKey: "saasSettings", icon: "⚙" },

    ],

  },

];



const TENANT_ADMIN_NAV: NavGroup[] = [

  {

    titleKey: "groups.securityIam",

    items: [

      { href: "/settings/users", labelKey: "userManagement", icon: "◌" },

      { href: "/settings/branches", labelKey: "branchManagement", icon: "⌂" },

      { href: "/settings/roles", labelKey: "rolesPermissions", icon: "◍" },

      { href: "/settings/audit", labelKey: "auditCenter", icon: "◎" },

    ],

  },

  {

    titleKey: "groups.diagnosticSetup",

    items: [

      { href: "/settings/service-catalog", labelKey: "serviceCatalog", icon: "◈" },

      { href: "/settings/services", labelKey: "importedServices", icon: "◎" },

      { href: "/settings/test-parameters", labelKey: "testParameters", icon: "⬡" },

      { href: "/settings/sample-types", labelKey: "sampleTypes", icon: "⬢" },

      { href: "/settings/containers", labelKey: "containersTubes", icon: "▤" },

      { href: "/settings/analyzers", labelKey: "analyzers", icon: "⇄" },

      { href: "/settings/doctors", labelKey: "doctors", icon: "✚" },

      { href: "/settings/report-layouts", labelKey: "reportLayouts", icon: "⎙" },

    ],

  },

];



const RECEPTION_NAV: NavGroup[] = [

  {

    titleKey: "groups.reception",

    items: [

      { href: "/patients/new", labelKey: "patientRegistration", icon: "＋" },

      { href: "/patients", labelKey: "patientSearch", icon: "⌕" },

      { href: "/appointments/new", labelKey: "appointmentBooking", icon: "📅" },

      { href: "/appointments", labelKey: "appointmentList", icon: "☰" },

      { href: "/appointments/queue", labelKey: "queueDashboard", icon: "⏱" },

      { href: "/consultations", labelKey: "consultationList", icon: "☰" },

      {

        href: "/diagnostic/billing",

        labelKey: "diagnosticBilling",

        icon: "₤",

      },

    ],

  },

];



const DOCTOR_NAV: NavGroup[] = [

  {

    titleKey: "groups.doctor",

    items: [

      { href: "/doctor/worklist", labelKey: "doctorWorklist", icon: "✚" },

      { href: "/consultations", labelKey: "consultationList", icon: "☰" },

    ],

  },

];



const LAB_NAV: NavGroup[] = [

  {

    titleKey: "groups.laboratory",

    items: [

      {

        href: "/lab/sample-collection",

        labelKey: "sampleCollection",

        icon: "⬢",

      },

      { href: "/lab/label-print", labelKey: "labelPrint", icon: "▤" },

      { href: "/lab/lis-worklist", labelKey: "lisWorklist", icon: "⇄" },

      {

        href: "/lab/result-entry",

        labelKey: "manualResultEntry",

        icon: "✎",

      },

      { href: "/lab/verification", labelKey: "verification", icon: "✓" },

      { href: "/lab/report-release", labelKey: "reportRelease", icon: "⎙" },

    ],

  },

];



const BILLING_NAV: NavGroup[] = [

  {

    titleKey: "groups.billing",

    items: [

      {

        href: "/diagnostic/billing",

        labelKey: "diagnosticBilling",

        icon: "₤",

      },

    ],

  },

];



const REPORT_DELIVERY_NAV: NavGroup[] = [

  {

    titleKey: "groups.reportDelivery",

    items: [

      { href: "/lab/report-release", labelKey: "reportRelease", icon: "⎙" },

    ],

  },

];



const PORTAL_NAV: NavGroup[] = [

  {

    titleKey: "groups.patientPortal",

    items: [{ href: "/portal/reports", labelKey: "myReports", icon: "☰" }],

  },

];



export function getHostNavGroups(): NavGroup[] {

  return HOST_NAV;

}



export function getTenantNavGroups(session: SessionContext): NavGroup[] {

  const roleCode = session.user.roleCode;
  const role = session.user.role;



  if (
    roleCode === "TENANT_ADMIN" ||
    role === "Tenant Admin" ||
    role === "Company Admin" ||
    role === "Primary Tenant Admin"
  ) {

    return TENANT_ADMIN_NAV;

  }



  if (role === "Reception" || role === "Receptionist" || role === "Cashier") {

    return RECEPTION_NAV;

  }



  if (role === "Doctor" || roleCode === "DOCTOR") {

    return DOCTOR_NAV;

  }



  if (

    role === "Lab Technician" ||

    role === "Lab Supervisor" ||

    role === "Pathologist"

  ) {

    return LAB_NAV;

  }



  if (role === "Billing") {

    return BILLING_NAV;

  }



  if (role === "Report Delivery") {

    return REPORT_DELIVERY_NAV;

  }



  if (role === "Patient Portal" || role === "Patient Portal User") {

    return PORTAL_NAV;

  }



  return RECEPTION_NAV;

}



export function getNavGroups(session: SessionContext): NavGroup[] {

  if (isHostSession(session)) {

    return getHostNavGroups();

  }



  return getTenantNavGroups(session);

}



/** @deprecated Use getNavGroups */

export function getDiagnosticNavGroups(session: SessionContext): NavGroup[] {

  return getNavGroups(session);

}



export function getRoleHomePath(role: string, roleCode?: string): string {

  if (role === "Host Admin" || roleCode === "HOST_ADMIN") return "/host/dashboard";

  if (
    roleCode === "TENANT_ADMIN" ||
    role === "Tenant Admin" ||
    role === "Company Admin" ||
    role === "Primary Tenant Admin"
  ) {
    return "/settings/users";
  }

  if (
    roleCode === "RECEPTION" ||
    role === "Reception" ||
    role === "Receptionist" ||
    role === "Cashier"
  ) {
    return "/dashboard";
  }

  if (roleCode === "DOCTOR" || role === "Doctor") {
    return "/doctor/worklist";
  }

  if (
    roleCode === "LAB_TECH" ||
    role === "Lab Technician" ||
    role === "Lab Supervisor" ||
    role === "Pathologist"
  ) {
    return "/lab/sample-collection";
  }

  if (roleCode === "BILLING" || role === "Billing") return "/diagnostic/billing";

  if (role === "Report Delivery") return "/lab/report-release";

  if (role === "Patient Portal" || role === "Patient Portal User") {
    return "/portal/reports";
  }

  return "/dashboard";

}

