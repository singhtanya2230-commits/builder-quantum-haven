import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Pill, Moon, Sun, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import ReminderPopup from "@/components/ReminderPopup";

const queryClient = new QueryClient();

function Header() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("theme");
      if (v === "dark") return true;
      if (v === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) root.classList.add("dark");
      else root.classList.remove("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
            <Pill className="h-5 w-5" />
          </span>
          <span className="font-extrabold tracking-tight text-xl">Pillbox</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="https://builder.io/c/docs/projects" target="_blank" rel="noreferrer" className="hover:text-foreground">Docs</a>
          <button
            aria-pressed={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            onClick={() => setIsDark((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-accent/60 active:scale-95 transition"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-white/60 dark:bg-background/60">
      <div className="container py-8 text-center text-sm text-muted-foreground">
        <p>
          Digital Pillbox Reminder • Built with ❤️
        </p>
      </div>
    </footer>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ReminderPopup />
      <div className="min-h-screen bg-[radial-gradient(60%_60%_at_50%_0%,#e6f9ff_0%,transparent_60%),linear-gradient(to_bottom_right,#f8fbff,#f3f6ff)] dark:bg-background">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
