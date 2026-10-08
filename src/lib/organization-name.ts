export const ORGANIZATION_NAME_MAX = 60;

// Shared by "create organization" and "rename organization". Returns the cleaned name,
// or an error message to show next to the form.
export function checkOrganizationName(raw: unknown): { name: string } | { error: string } {
  const name = String(raw ?? "").trim();
  if (!name) {
    return { error: "Please enter a name." };
  }
  if (name.length > ORGANIZATION_NAME_MAX) {
    return { error: `Please use ${ORGANIZATION_NAME_MAX} characters or fewer.` };
  }
  return { name };
}
