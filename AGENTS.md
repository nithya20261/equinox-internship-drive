<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS

- Confirmed event facts live only in `src/data/site.ts`; anything absent renders as "To Be Announced" — never invent companies, roles or metrics.
- Entity types in `src/types` mirror planned backend tables (UUID ids, timestamps) so data can be wired in without UI changes.
- Shared UI lives in `src/components/site` (primitives, blocks) and styling utilities (`btn-*`, `field`, `display`, `eyebrow`) in `src/styles.css` — reuse them, no ad hoc colours.
- Dashboards share `DashboardShell`; sections show empty states until real data and auth exist.
