import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About reasoning models — Reasoning Lab" },
      {
        name: "description",
        content:
          "When does a reasoning model help? When is a fast model enough? A short, plain-language primer.",
      },
      { property: "og:title", content: "About reasoning models" },
      {
        property: "og:description",
        content: "A short primer on when reasoning models earn their keep.",
      },
    ],
  }),
  component: AboutPage,
});

const USE_CASES = [
  "Multi-step math or logic",
  "Code review for concurrency / edge cases",
  "Legal, contract, or policy analysis",
  "Judging or comparing answers with a rubric",
  "Planning sequences with dependencies",
];

const SKIP_CASES = [
  "Lookups and short factual questions",
  "Simple summarization or rephrasing",
  "Boilerplate code or scaffolding",
  "Short conversational replies",
  "Tasks where latency matters more than depth",
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Primer
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          When reasoning models help
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Reasoning models trade latency and cost for depth. They explicitly think before answering
          — generating a chain of internal steps that an end-user usually doesn't see. That extra
          work pays off on some tasks and is wasted on others.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Check className="h-4 w-4 text-primary" /> Use reasoning when…
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {USE_CASES.map((u) => (
                  <li key={u} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <X className="h-4 w-4 text-muted-foreground" /> Skip reasoning when…
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {SKIP_CASES.map((u) => (
                  <li key={u} className="flex gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-12 text-xl font-semibold tracking-tight">The four-stage loop</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The Lab walks you through a deliberate pipeline. Each stage is labeled inline so the
          process is visible — not a black box.
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          <li>
            <strong className="text-foreground">Task.</strong> The question or problem, stated
            plainly.
          </li>
          <li>
            <strong className="text-foreground">Fast answer.</strong> What a quick model produces in
            milliseconds.
          </li>
          <li>
            <strong className="text-foreground">Reasoning answer.</strong> What a deeper model
            produces with explicit steps.
          </li>
          <li>
            <strong className="text-foreground">Critique.</strong> Specific findings about what each
            answer got wrong.
          </li>
          <li>
            <strong className="text-foreground">Revision.</strong> A cleaner final answer that
            incorporates the critique.
          </li>
        </ol>

        <div className="mt-12 rounded-lg border border-border bg-muted/40 p-5 text-sm">
          <p className="text-muted-foreground">
            Ready to try it?{" "}
            <Link to="/lab" className="font-medium text-foreground underline-offset-4 hover:underline">
              Open the Lab →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
