import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  Play,
  Undo2,
  Redo2,
  RotateCcw,
  Copy,
  Sparkles,
  Zap,
  Brain,
  Loader2,
  Info,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PRESETS, getPreset, type Preset, type Score } from "@/lib/presets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  preset: z.string().optional(),
});

export const Route = createFileRoute("/lab")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lab — Reasoning Lab" },
      {
        name: "description",
        content:
          "Interactive workspace to compare fast vs. reasoning answers, with critique and revision.",
      },
      { property: "og:title", content: "Reasoning Lab — Workspace" },
      {
        property: "og:description",
        content: "Compare fast vs. reasoning model outputs, side by side.",
      },
    ],
  }),
  component: LabPage,
});

type Settings = {
  depth: number;
  showCritique: boolean;
  mode: "mocked" | "live";
};

type Session = {
  presetId: string | null;
  task: string;
  settings: Settings;
  ran: boolean;
  notes: string;
};

const DEFAULT_SETTINGS: Settings = { depth: 2, showCritique: true, mode: "mocked" };
const EMPTY_SESSION: Session = {
  presetId: null,
  task: "",
  settings: DEFAULT_SETTINGS,
  ran: false,
  notes: "",
};

const STORAGE_KEY = "rl:session:v1";
const HISTORY_KEY = "rl:history:v1";

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY_SESSION, ...JSON.parse(raw) };
  } catch {}
  return EMPTY_SESSION;
}

function loadHistory(): { id: string; title: string; ts: number }[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function useUndoRedo<T>(initial: T) {
  const [past, setPast] = React.useState<T[]>([]);
  const [present, setPresent] = React.useState<T>(initial);
  const [future, setFuture] = React.useState<T[]>([]);

  const set = React.useCallback(
    (next: T | ((p: T) => T), record = true) => {
      setPresent((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (record) {
          setPast((p) => [...p.slice(-49), prev]);
          setFuture([]);
        }
        return value;
      });
    },
    [],
  );

  const undo = React.useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [present, ...f].slice(0, 50));
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = React.useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, present].slice(-50));
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    reset: (v: T) => {
      setPast([]);
      setFuture([]);
      setPresent(v);
    },
  };
}

function LabPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const initial = React.useMemo(() => {
    const s = loadSession();
    if (search.preset) {
      const p = getPreset(search.preset);
      if (p) return { ...EMPTY_SESSION, presetId: p.id, task: p.task };
    }
    return s;
  }, [search.preset]);

  const { state: session, set: setSession, undo, redo, canUndo, canRedo, reset } =
    useUndoRedo<Session>(initial);

  const [running, setRunning] = React.useState(false);
  const [revealStage, setRevealStage] = React.useState(0); // 0 none, 1 fast, 2 reasoning, 3 critique, 4 final
  const [history, setHistory] = React.useState(loadHistory);

  const preset = session.presetId ? getPreset(session.presetId) : undefined;

  // Persist session
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {}
  }, [session]);

  // Restore reveal if previously ran
  React.useEffect(() => {
    if (session.ran && preset) setRevealStage(4);
    else setRevealStage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.presetId, session.ran]);

  // Keyboard undo/redo
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const runPipeline = React.useCallback(
    (replay = false) => {
      if (!preset) {
        toast.error("Pick a preset to run a simulated pipeline.");
        return;
      }
      setRunning(true);
      setRevealStage(0);
      const t1 = setTimeout(() => setRevealStage(1), 350);
      const t2 = setTimeout(() => setRevealStage(2), 1500);
      const t3 = setTimeout(() => setRevealStage(3), 2300);
      const t4 = setTimeout(() => {
        setRevealStage(4);
        setRunning(false);
        if (!replay) {
          setSession((s) => ({ ...s, ran: true }));
          // history
          setHistory((prev) => {
            const next = [
              { id: preset.id + ":" + Date.now(), title: preset.title, ts: Date.now() },
              ...prev,
            ].slice(0, 10);
            try {
              localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      }, 3000);
      return () => {
        [t1, t2, t3, t4].forEach(clearTimeout);
      };
    },
    [preset, setSession],
  );

  const onPresetChange = (id: string) => {
    const p = getPreset(id);
    if (!p) return;
    setSession({
      presetId: p.id,
      task: p.task,
      settings: session.settings,
      ran: false,
      notes: "",
    });
  };

  const resetSession = () => {
    reset(EMPTY_SESSION);
    setRevealStage(0);
    navigate({ to: "/lab", search: {} });
    toast("Session cleared.");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background text-foreground">
        <Header />

        {/* Mobile sticky action bar */}
        <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-3 py-2">
            <Button size="sm" onClick={() => runPipeline()} disabled={running} className="flex-1">
              {running ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="mr-1.5 h-3.5 w-3.5" />
              )}
              Run
            </Button>
            <Button size="icon" variant="outline" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={resetSession} aria-label="Reset session">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-6">
          {/* Mode badge */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <Badge
              variant={session.settings.mode === "mocked" ? "secondary" : "default"}
              className="font-normal"
            >
              <span
                className={cn(
                  "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                  session.settings.mode === "mocked" ? "bg-muted-foreground" : "bg-primary",
                )}
              />
              {session.settings.mode === "mocked" ? "Simulated mode" : "Live mode"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {preset ? preset.title : "Blank lab"}
            </p>
          </div>

          {/* Desktop: 3-panel grid. Mobile: tabs */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
            <aside className="lg:col-span-3">
              <LeftPanel
                session={session}
                setSession={setSession}
                onPresetChange={onPresetChange}
                onRun={() => runPipeline()}
                onUndo={undo}
                onRedo={redo}
                onReset={resetSession}
                canUndo={canUndo}
                canRedo={canRedo}
                running={running}
                history={history}
              />
            </aside>
            <section className="lg:col-span-5 space-y-4">
              <CenterPanel preset={preset} revealStage={revealStage} onCopy={copy} />
            </section>
            <aside className="lg:col-span-4 space-y-4">
              <RightPanel
                preset={preset}
                revealStage={revealStage}
                showCritique={session.settings.showCritique}
                onReplay={() => runPipeline(true)}
              />
            </aside>
          </div>

          <div className="lg:hidden">
            <Tabs defaultValue="inputs">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="outputs">Outputs</TabsTrigger>
                <TabsTrigger value="critique">Critique</TabsTrigger>
              </TabsList>
              <TabsContent value="inputs" className="mt-4">
                <LeftPanel
                  session={session}
                  setSession={setSession}
                  onPresetChange={onPresetChange}
                  onRun={() => runPipeline()}
                  onUndo={undo}
                  onRedo={redo}
                  onReset={resetSession}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  running={running}
                  history={history}
                  compact
                />
              </TabsContent>
              <TabsContent value="outputs" className="mt-4 space-y-4">
                <CenterPanel preset={preset} revealStage={revealStage} onCopy={copy} />
              </TabsContent>
              <TabsContent value="critique" className="mt-4 space-y-4">
                <RightPanel
                  preset={preset}
                  revealStage={revealStage}
                  showCritique={session.settings.showCritique}
                  onReplay={() => runPipeline(true)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

/* ---------------- Left panel ---------------- */

function LeftPanel({
  session,
  setSession,
  onPresetChange,
  onRun,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
  running,
  history,
  compact,
}: {
  session: Session;
  setSession: (next: Session | ((p: Session) => Session)) => void;
  onPresetChange: (id: string) => void;
  onRun: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  running: boolean;
  history: { id: string; title: string; ts: number }[];
  compact?: boolean;
}) {
  const preset = session.presetId ? getPreset(session.presetId) : undefined;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Preset
        </Label>
        <Select value={session.presetId ?? ""} onValueChange={onPresetChange}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Pick a preset…" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4">
          <Label htmlFor="task" className="text-xs uppercase tracking-wider text-muted-foreground">
            Task
          </Label>
          <Textarea
            id="task"
            value={session.task}
            onChange={(e) => setSession((s) => ({ ...s, task: e.target.value, ran: false }))}
            placeholder="Describe a task or paste a question…"
            className="mt-2 min-h-[140px] resize-y font-mono text-xs leading-relaxed"
          />
        </div>

        {preset && preset.quickActions.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {preset.quickActions.map((q) => (
                <button
                  key={q}
                  onClick={() =>
                    setSession((s) => ({ ...s, task: s.task + "\n\n" + q, ran: false }))
                  }
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Mode</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              setSession((s) => ({ ...s, settings: { ...s.settings, mode: "mocked" } }))
            }
            className={cn(
              "rounded-md border px-3 py-2 text-left text-xs transition-colors",
              session.settings.mode === "mocked"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3 w-3" /> Simulated
            </div>
            <p className="mt-0.5 text-[10px] opacity-80">Polished, no API key.</p>
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled
                className="cursor-not-allowed rounded-md border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground opacity-60"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <Brain className="h-3 w-3" /> Live
                </div>
                <p className="mt-0.5 text-[10px]">Coming soon</p>
              </button>
            </TooltipTrigger>
            <TooltipContent>Add a key to enable Live mode.</TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Reasoning depth</Label>
              <span className="text-xs text-muted-foreground">
                {["Shallow", "Medium", "Deep"][session.settings.depth - 1] ?? "Medium"}
              </span>
            </div>
            <Slider
              value={[session.settings.depth]}
              min={1}
              max={3}
              step={1}
              onValueChange={(v) =>
                setSession((s) => ({ ...s, settings: { ...s.settings, depth: v[0] } }))
              }
              className="mt-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-critique" className="text-xs">
              Show critique
            </Label>
            <Switch
              id="show-critique"
              checked={session.settings.showCritique}
              onCheckedChange={(v) =>
                setSession((s) => ({ ...s, settings: { ...s.settings, showCritique: v } }))
              }
            />
          </div>
        </div>
      </Card>

      {!compact && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
            <span className="text-[10px] text-muted-foreground">Autosaved</span>
          </div>
          <Textarea
            value={session.notes}
            onChange={(e) => setSession((s) => ({ ...s, notes: e.target.value }), false)}
            placeholder="Jot observations…"
            className="mt-2 min-h-[80px] text-xs"
          />
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button onClick={onRun} disabled={running} size="lg" className="w-full">
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" /> Run pipeline
            </>
          )}
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
            <Undo2 className="mr-1 h-3.5 w-3.5" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
            <Redo2 className="mr-1 h-3.5 w-3.5" /> Redo
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {!compact && history.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Recent runs
          </p>
          <ul className="space-y-1">
            {history.slice(0, 6).map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
              >
                <span className="truncate">{h.title}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ---------------- Center panel ---------------- */

function LabelChip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "primary" | "success" | "warn" }) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

function OutputCard({
  label,
  tone,
  icon: Icon,
  title,
  stats,
  body,
  onCopy,
  loading,
  visible,
}: {
  label: string;
  tone: "default" | "primary" | "success" | "warn";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  stats: string;
  body: string;
  onCopy: () => void;
  loading: boolean;
  visible: boolean;
}) {
  return (
    <Card className="overflow-hidden p-0 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
          <LabelChip tone={tone}>{label}</LabelChip>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] text-muted-foreground sm:inline">{stats}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy} aria-label="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ) : visible ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
            {body}
          </pre>
        ) : (
          <p className="text-xs italic text-muted-foreground">Run the pipeline to see output.</p>
        )}
      </div>
    </Card>
  );
}

function CenterPanel({
  preset,
  revealStage,
  onCopy,
}: {
  preset: Preset | undefined;
  revealStage: number;
  onCopy: (text: string, label: string) => void;
}) {
  if (!preset) {
    return (
      <Card className="p-8 text-center">
        <Brain className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No preset selected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a preset on the left to load a task and outputs.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <LabelChip>Task</LabelChip>
          <span className="text-xs text-muted-foreground">{preset.title}</span>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
          {preset.task}
        </pre>
      </Card>

      <OutputCard
        label="Fast answer"
        tone="warn"
        icon={Zap}
        title="Fast model"
        stats="~280ms · 92 tokens"
        body={preset.fastAnswer}
        onCopy={() => onCopy(preset.fastAnswer, "Fast answer")}
        loading={revealStage === 0}
        visible={revealStage >= 1}
      />

      <OutputCard
        label="Reasoning"
        tone="primary"
        icon={Brain}
        title="Reasoning model"
        stats="~1.6s · 412 tokens"
        body={preset.reasoningAnswer}
        onCopy={() => onCopy(preset.reasoningAnswer, "Reasoning answer")}
        loading={revealStage > 0 && revealStage < 2}
        visible={revealStage >= 2}
      />
    </>
  );
}

/* ---------------- Right panel ---------------- */

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{value}/10</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function Scorecard({ title, score }: { title: string; score: Score }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-foreground">{title}</p>
      <div className="space-y-2">
        <ScoreBar label="Accuracy" value={score.accuracy} />
        <ScoreBar label="Reasoning" value={score.reasoning} />
        <ScoreBar label="Clarity" value={score.clarity} />
        <ScoreBar label="Completeness" value={score.completeness} />
      </div>
    </div>
  );
}

function RightPanel({
  preset,
  revealStage,
  showCritique,
  onReplay,
}: {
  preset: Preset | undefined;
  revealStage: number;
  showCritique: boolean;
  onReplay: () => void;
}) {
  const [explainOpen, setExplainOpen] = React.useState(false);

  if (!preset) {
    return (
      <Card className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Critique, scorecard, and revision will appear here.
        </p>
      </Card>
    );
  }

  return (
    <>
      {showCritique && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <LabelChip tone="warn">Critique</LabelChip>
            {revealStage >= 3 && (
              <button
                onClick={onReplay}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Replay run
              </button>
            )}
          </div>
          {revealStage >= 3 ? (
            <ul className="space-y-1.5 text-xs">
              {preset.critique.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600 dark:text-amber-400">▸</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs italic text-muted-foreground">Awaiting outputs…</p>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-3">
          <LabelChip>Score</LabelChip>
        </div>
        {revealStage >= 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Scorecard title="Fast answer" score={preset.fastScore} />
            <Scorecard title="Reasoning answer" score={preset.reasoningScore} />
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">Run to score.</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2">
          <LabelChip tone="success">Final</LabelChip>
        </div>
        {revealStage >= 4 ? (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
            {preset.revised}
          </pre>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            Final revised answer will appear after critique.
          </p>
        )}
      </Card>

      <Collapsible open={explainOpen} onOpenChange={setExplainOpen}>
        <Card className="p-0">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-accent">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Explain this result
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                explainOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {preset.explanation}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
