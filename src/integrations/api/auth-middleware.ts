import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const requireApiAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const authorization = getRequest()?.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: authentication is required.");
  }
  return next({ context: { authorization } });
});
