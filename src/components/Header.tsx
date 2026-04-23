import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Sparkles, RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Reasoning Lab</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/lab"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
          >
            Lab
          </Link>
          <Link
            to="/about"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
          >
            About
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="hidden sm:inline-flex"
            aria-label="Reset to home"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
