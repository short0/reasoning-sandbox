import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Brain, MessageSquare, ScrollText, RefreshCw } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRESETS } from "@/lib/presets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reasoning Lab — See when AI should think harder" },
      {
        name: "description",
        content:
          "An interactive sandbox for understanding when reasoning models help. Compare fast answers vs. step-by-step reasoning, with critique and revision.",
      },
      { property: "og:title", content: "Reasoning Lab" },
      {
        property: "og:description",
        content: "Learn when AI reasoning helps — with hands-on presets and clear comparisons.",
      },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  { icon: MessageSquare, label: "Task", text: "A real question or problem" },
  { icon: Brain, label: "Answer", text: "Fast vs. reasoning side-by-side" },
  { icon: ScrollText, label: "Critique", text: "What the answer got wrong" },
  { icon: RefreshCw, label: "Revise", text: "A cleaner final answer" },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <Badge variant="secondary" className="mb-6 font-normal">
            Simulated mode · no API key required
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            See when a model should{" "}
            <span className="text-primary">think harder</span> — and when it shouldn't.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A calm, hands-on sandbox for understanding reasoning models. Compare a fast answer to a
            reasoning answer, watch the critique, and see the revision — all in one view.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => {
                document.getElementById("presets")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Try a preset
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate({ to: "/lab" })}>
              Open blank lab
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-10 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Four steps. One screen.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <div
                  key={s.label}
                  className="relative rounded-xl border border-border bg-card p-5"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} · {s.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Presets */}
        <section id="presets" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Presets
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Launch a ready-made example
              </h2>
            </div>
            <Link
              to="/lab"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Or start blank →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  navigate({ to: "/lab", search: { preset: p.id } as never })
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-normal">
                      {p.tag}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <CardTitle className="mt-3 text-lg">{p.title}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{p.task}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            All presets run in simulated mode by default. No API keys, no network calls.
          </p>
        </section>
      </main>
    </div>
  );
}
