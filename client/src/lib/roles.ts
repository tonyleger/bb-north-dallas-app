export const ROLES = {
  GM: "GM",
  FRONT_ADMIN: "Front Admin",
  SALES_CONSULTANT: "Sales Consultant",
  BACK_ADMIN: "Back Admin",
  WAREHOUSE_MGR: "Warehouse MGR",
  INSTALLER: "Installer",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Section visibility rules by role
const VISIBILITY_MAP: Record<Role, Set<string>> = {
  [ROLES.GM]: new Set([
    "dashboard",
    "lead-manager",
    "clients",
    "client-detail",
    "projects",
    "project-detail",
    "schedule",
    "follow-ups",
    "service",
  ]),
  [ROLES.FRONT_ADMIN]: new Set([
    "dashboard",
    "lead-manager",
    "clients",
    "client-detail",
    "schedule",
  ]),
  [ROLES.SALES_CONSULTANT]: new Set([
    "dashboard",
    "clients",
    "client-detail",
    "projects",
    "project-detail",
    "schedule",
    "follow-ups",
  ]),
  [ROLES.BACK_ADMIN]: new Set([
    "dashboard",
    "projects",
    "project-detail",
    "schedule",
    "clients",
    "client-detail",
    "follow-ups",
    "service",
  ]),
  [ROLES.WAREHOUSE_MGR]: new Set([
    "dashboard",
    "projects",
    "project-detail",
    "schedule",
  ]),
  [ROLES.INSTALLER]: new Set([
    "dashboard",
    "projects",
    "project-detail",
    "schedule",
    "service",
  ]),
};

/**
 * Check if a role can view a specific section
 */
export function canSee(role: string | undefined, section: string): boolean {
  if (!role) return false;
  const sections = VISIBILITY_MAP[role as Role];
  return sections ? sections.has(section) : false;
}

/**
 * Get all visible sections for a role
 */
export function getVisibleSections(role: string | undefined): string[] {
  if (!role) return [];
  const sections = VISIBILITY_MAP[role as Role];
  return sections ? Array.from(sections) : [];
}

/**
 * Check if a role has full admin access
 */
export function isAdmin(role: string | undefined): boolean {
  return role === ROLES.GM || role === ROLES.BACK_ADMIN;
}

/**
 * Check if a role is sales-focused
 */
export function isSales(role: string | undefined): boolean {
  return role === ROLES.SALES_CONSULTANT || role === ROLES.FRONT_ADMIN;
}

/**
 * Get the friendly display name for a role
 */
export function getRoleDisplayName(role: string | undefined): string {
  if (!role) return "Unknown";
  return role;
}
