import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/company")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
