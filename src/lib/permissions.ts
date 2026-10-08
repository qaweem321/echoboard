export const roles = ["owner", "admin", "member"] as const;
export type Role = (typeof roles)[number];

const permissions = {
  "organization:update": ["owner", "admin"],
  "organization:delete": ["owner"],
  "member:remove": ["owner", "admin"],
  "member:invite": ["owner", "admin"],
  "member:update-role": ["owner"],
  "billing:manage": ["owner"],
  // Boards shape the public portal, so only owners and admins create, rename or delete them.
  "board:manage": ["owner", "admin"],
  // Everyone on the team triages feedback: statuses, edits, merging duplicates.
  "feedback:manage": ["owner", "admin", "member"],
  // Deleting posts and comments removes customers' words for good, so owners and admins only.
  "feedback:delete": ["owner", "admin"],
  // The changelog is public and can email voters, so owners and admins only.
  "changelog:manage": ["owner", "admin"],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof permissions;

export function can(role: Role, permission: Permission) {
  return (permissions[permission] as Role[]).includes(role);
}

export function isRole(value: string): value is Role {
  return (roles as readonly string[]).includes(value);
}
