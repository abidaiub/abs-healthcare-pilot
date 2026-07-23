import type { SessionContext } from "@/lib/session";

import { isHostSession } from "@/lib/session";



export type NavItem = {

  href: string;

  label: string;

  icon: string;

};



export type NavGroup = {

  title: string;

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

    title: "Host Console",

    items: [

      { href: "/host/dashboard", label: "Host Dashboard", icon: "◉" },
      { href: "/host/tenants", label: "Tenant Management", icon: "◇" },
      { href: "/host/subscription-packages", label: "Subscription Packages", icon: "◆" },
      { href: "/host/modules", label: "Module Registry", icon: "▦" },
      { href: "/host/audit", label: "Audit Log", icon: "◎" },
      { href: "/host/catalog", label: "Host Test Catalog", icon: "◈" },
      { href: "/host/settings", label: "SaaS Settings", icon: "⚙" },

    ],

  },

];



const TENANT_ADMIN_NAV: NavGroup[] = [

  {

    title: "Security & IAM",

    items: [

      { href: "/settings/users", label: "User Management", icon: "◌" },

      { href: "/settings/roles", label: "Roles & Permissions", icon: "◍" },

      { href: "/settings/audit", label: "Audit Center", icon: "◎" },

    ],

  },

  {

    title: "Diagnostic Setup",

    items: [

      { href: "/settings/service-catalog", label: "Service Catalog", icon: "◈" },

      { href: "/settings/services", label: "Imported Services", icon: "◎" },

      { href: "/settings/test-parameters", label: "Test Parameters", icon: "⬡" },

      { href: "/settings/sample-types", label: "Sample Types", icon: "⬢" },

      { href: "/settings/containers", label: "Containers & Tubes", icon: "▤" },

      { href: "/settings/analyzers", label: "Analyzers", icon: "⇄" },

      { href: "/settings/doctors", label: "Doctors", icon: "✚" },

      { href: "/settings/report-layouts", label: "Report Layouts", icon: "⎙" },

    ],

  },

];



const RECEPTION_NAV: NavGroup[] = [

  {

    title: "Reception",

    items: [

      { href: "/patients/new", label: "Patient Registration", icon: "＋" },

      { href: "/patients", label: "Patient Search", icon: "⌕" },

      {

        href: "/diagnostic/billing",

        label: "Diagnostic Billing / Test Order",

        icon: "₤",

      },

    ],

  },

];



const LAB_NAV: NavGroup[] = [

  {

    title: "Laboratory",

    items: [

      {

        href: "/lab/sample-collection",

        label: "Sample Collection",

        icon: "⬢",

      },

      { href: "/lab/label-print", label: "Label Print", icon: "▤" },

      { href: "/lab/lis-worklist", label: "LIS Worklist", icon: "⇄" },

      {

        href: "/lab/result-entry",

        label: "Manual Result Entry",

        icon: "✎",

      },

      { href: "/lab/verification", label: "Verification", icon: "✓" },

      { href: "/lab/report-release", label: "Report Release", icon: "⎙" },

    ],

  },

];



const BILLING_NAV: NavGroup[] = [

  {

    title: "Billing",

    items: [

      {

        href: "/diagnostic/billing",

        label: "Diagnostic Billing / Test Order",

        icon: "₤",

      },

    ],

  },

];



const REPORT_DELIVERY_NAV: NavGroup[] = [

  {

    title: "Report Delivery",

    items: [

      { href: "/lab/report-release", label: "Report Release", icon: "⎙" },

    ],

  },

];



const PORTAL_NAV: NavGroup[] = [

  {

    title: "Patient Portal",

    items: [{ href: "/portal/reports", label: "My Reports", icon: "☰" }],

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

