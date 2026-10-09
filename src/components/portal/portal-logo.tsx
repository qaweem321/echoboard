type Props = { name: string; logoUrl: string | null };

// The workspace's logo, or its name when it has none.
export function PortalLogo({ name, logoUrl }: Props) {
  if (!logoUrl) {
    return <span className="text-lg font-bold">{name}</span>;
  }
  return (
    // A plain <img>: logos are on each workspace's own servers, which next/image would need
    // listed in advance.
    // biome-ignore lint/performance/noImgElement: logos come from any domain the workspace uses
    <img src={logoUrl} alt={name} className="h-8 w-auto max-w-48 object-contain" />
  );
}
