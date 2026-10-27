import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/seo";
import { AboutPage } from "./about";

export const Route = createFileRoute("/how-it-works")({
  head: () =>
    pageMeta(
      "How It Works & About",
      "Learn how students and companies participate in the Equinox 2K26 Internship Drive — from registration to tracking applications."
    ),
  component: AboutPage,
});
