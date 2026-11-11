import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
function match(pathname: string) {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  return router.matchRoutes(pathname).at(-1)?.routeId;
}

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    expect(match("/")).toBeDefined();
    expect(match("/")).not.toBe(rootRouteId);
  });

  it("serves the sign-in page at /auth", () => {
    expect(match("/auth")).toBe("/auth");
  });

  it("serves the password recovery page at /reset-password", () => {
    expect(match("/reset-password")).toBe("/reset-password");
  });

  it("serves every app screen behind the sign-in gate", () => {
    expect(match("/dashboard")).toBe("/_authenticated/dashboard");
    expect(match("/farms")).toBe("/_authenticated/farms");
    expect(match("/satellite")).toBe("/_authenticated/satellite");
    expect(match("/climate")).toBe("/_authenticated/climate");
    expect(match("/ai")).toBe("/_authenticated/ai");
    expect(match("/alerts")).toBe("/_authenticated/alerts");
    expect(match("/reports")).toBe("/_authenticated/reports");
    expect(match("/settings")).toBe("/_authenticated/settings");
  });

  it("keeps the landing page public at / and does not claim it from the gated tree", () => {
    expect(match("/")).toBe("/");
    expect(match("/dashboard")).not.toBe("/");
  });
});
