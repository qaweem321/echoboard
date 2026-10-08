// The organization the user opened last, so logging in takes them back to it.
// Only a slug is stored; membership is always checked before using it.
export const LAST_ORGANIZATION_COOKIE = "last-organization";

// "/dashboard/acme/members" -> "acme". Returns null for other paths.
export function organizationSlugFromPath(pathname: string) {
  const [, first, slug] = pathname.split("/");
  return first === "dashboard" && slug ? slug : null;
}

// Which organization to open after login: the last-used one if the user still belongs to it,
// or their only one. Returns undefined when they must choose (several organizations and no
// last-used one, e.g. on a new device) or have none yet.
export function pickOrganization<T extends { slug: string }>(
  organizations: T[],
  lastSlug: string | undefined,
) {
  const last = organizations.find((organization) => organization.slug === lastSlug);
  return last ?? (organizations.length === 1 ? organizations[0] : undefined);
}
