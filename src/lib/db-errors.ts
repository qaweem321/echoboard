// Drizzle wraps the driver's error, so the Postgres code can be on the error or on its cause.
function postgresCode(error: unknown): string | undefined {
  const withCode = (value: unknown) =>
    typeof value === "object" && value !== null && "code" in value
      ? String((value as { code: unknown }).code)
      : undefined;
  return withCode(error) ?? withCode((error as { cause?: unknown } | null)?.cause);
}

// A row with the same unique value (like an organization slug) was saved first.
export const isUniqueViolation = (error: unknown) => postgresCode(error) === "23505";
