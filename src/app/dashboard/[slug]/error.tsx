"use client";

import { ErrorMessage } from "@/components/error-message";

export default function DashboardError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorMessage {...props} />;
}
