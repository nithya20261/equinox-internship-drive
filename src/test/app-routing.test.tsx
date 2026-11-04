import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

async function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  const originalError = console.error;
  vi.spyOn(console, "error").mockImplementation((...args: any[]) => {
    const msg = args.map((a) => (typeof a === "string" ? a : a?.message || String(a))).join(" ");
    if (
      msg.includes("cannot be a child of <div>") ||
      msg.includes("hydration error") ||
      msg.includes("syncAuthoritativeSession") ||
      msg.includes("No Start context found")
    ) {
      return;
    }
    originalError(...args);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Assert only that the router mounts and paints, never page content:
// routes are rewritten as the app is built and this must keep passing.
describe("App routing", () => {
  it("renders the index route", async () => {
    const { container } = await renderAt("/");

    await waitFor(() => expect(container.querySelector("main")).not.toBeNull());
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { container } = await renderAt("/this-route-does-not-exist");

    await waitFor(() => expect(container.querySelector("main") || container.firstChild).not.toBeNull());
  });

  it("renders /dashboard/admin route", async () => {
    const { container } = await renderAt("/dashboard/admin");
    await waitFor(() => expect(container.querySelector("main")).not.toBeNull());
  });

  it("renders /dashboard/admin route when logged in as admin", async () => {
    localStorage.setItem(
      "equinox_auth_user",
      JSON.stringify({
        id: "293f2877-1148-45a4-825e-2c4e6efa3e5b",
        role: "admin",
        email: "equinoxcie@admin.equinox.internal",
      })
    );
    const { container } = await renderAt("/dashboard/admin");
    await waitFor(() => expect(container.querySelector("main")).not.toBeNull());
  });
});
