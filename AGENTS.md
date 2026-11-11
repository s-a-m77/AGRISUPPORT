<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep appearance in a single app-wide theme provider with semantic CSS tokens; device-local theme storage is only a presentation preference, not account data.
- Keep home photo assets and scroll reveals in HomeMotion; progressive enhancement preserves visible content without JavaScript and respects reduced-motion preferences.
- Keep every signed-in screen under `src/routes/_authenticated/` at its own path, and read or write farmer data only through the server functions in `src/lib/agrisense.functions.ts`; components never call the database client directly. Why: the route gate and row-level security are the only things that actually protect a farmer's data.
- Keep public pages (landing, sign-in, password recovery) as top-level route files with no auth gate, and send sign-up links back to the page the farmer came from. Why: shared links and email confirmations must land where the farmer expected.
