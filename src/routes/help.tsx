import { createFileRoute, Link } from "@tanstack/react-router";

import { ThemeSelector } from "@/components/AppTheme";
import { LanguageSelector, useT, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — AgriSense Ethiopia" },
      { name: "description", content: "Answers to common questions about using AgriSense Ethiopia." },
      { property: "og:title", content: "Help Center — AgriSense Ethiopia" },
      { property: "og:description", content: "Answers to common questions about using AgriSense Ethiopia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const t = useT();
  const qs: [TKey, TKey][] = [["q1", "a1"], ["q2", "a2"], ["q3", "a3"], ["q4", "a4"]];
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm font-semibold text-app-success underline">{t("back")}</Link>
        <div className="flex gap-2"><LanguageSelector /><ThemeSelector /></div>
      </div>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-app-heading">{t("helpTitle")}</h1>
        <p className="text-sm text-app-ink/75">{t("helpSub")}</p>
      </header>
      <div className="space-y-4">
        {qs.map(([q, a]) => (
          <section key={q} className="rounded-xl border border-app-line bg-app-surface p-5 space-y-1">
            <h2 className="font-bold text-app-heading">{t(q)}</h2>
            <p className="text-sm text-app-ink/80">{t(a)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
