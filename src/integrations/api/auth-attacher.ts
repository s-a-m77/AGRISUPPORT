import { createMiddleware } from "@tanstack/react-start";

const TOKEN_KEY = "agrisupport_access_token";

export const attachApiAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = localStorage.getItem(TOKEN_KEY);
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
