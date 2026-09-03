'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Flame, CheckCircle2 } from 'lucide-react';

interface Problem {
  slug: string;
  formula: string;
  type?: string;
  title?: string;
}

interface PracticeFlowProps {
  problems: Problem[];
  level: string;
}

// P3-P2-4: lightweight, client-only practice loop.
// - No D1, no /api call, no backend. All data comes from the server-rendered
//   static library (already filtered by `difficulty` on the page), so the three
//   levels never share problems.
// - Streak / count persist in localStorage only.
// - The "answer" is the link to the single-problem page, which already renders
//   the authoritative step-by-step solution server-side. We do NOT compute or
//   guess derivatives in the client (no AI, no new API), and we do NOT touch the
//   SEO grid/list below the fold.
const MAX_POOL = 300;

function typePrefix(type?: string): string {
  if (type === 'integral') return '∫';
  if (type === 'limit') return 'lim';
  return "d/dx";
}

export default function PracticeFlow({ problems, level }: PracticeFlowProps) {
  const pool = (problems || []).slice(0, MAX_POOL);

  // `order` starts as the identity permutation so the very first server/client
  // render shows problems[0] deterministically (no hydration mismatch). The
  // client-only useEffect then shuffles it for practice variety — zero network.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: pool.length }, (_, i) => i)
  );
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ solved: 0, streak: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const solved = Number(localStorage.getItem(`pf:solved:${level}`) || 0);
      const streak = Number(localStorage.getItem(`pf:streak:${level}`) || 0);
      if (!Number.isNaN(solved)) setStats({ solved, streak });
    } catch {
      // ignore unavailable storage
    }
    if (pool.length > 1) {
      setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  if (pool.length === 0) return null;

  const current = pool[order[idx]] || pool[0];
  const problemUrl = `/${current.slug}`;

  const handleShow = () => {
    if (revealed) return;
    setRevealed(true);
    setStats((prev) => {
      const next = { solved: prev.solved + 1, streak: prev.streak + 1 };
      try {
        localStorage.setItem(`pf:solved:${level}`, String(next.solved));
        localStorage.setItem(`pf:streak:${level}`, String(next.streak));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleNext = () => {
    setRevealed(false);
    const next = idx + 1;
    if (next >= order.length) {
      setOrder((prev) => [...prev].sort(() => Math.random() - 0.5));
      setIdx(0);
    } else {
      setIdx(next);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-700 mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Practice Flow
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Solve one problem at a time. Reveal the answer when you&apos;re ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            {mounted ? stats.solved : 0} solved
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600">
            <Flame className="w-4 h-4 text-orange-500" />
            {mounted ? stats.streak : 0} streak
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700">
        <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
          {typePrefix(current.type)} · {current.title || 'Problem'}
        </div>
        <div className="font-mono text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white break-words mb-5">
          {current.formula}
        </div>

        {!revealed ? (
          <button
            onClick={handleShow}
            className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            Show answer
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <span className="text-sm">
                Here&apos;s the full worked solution — open it to check every step.
              </span>
            </div>
            <Link
              href={problemUrl}
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              View step-by-step solution
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={handleNext}
          disabled={pool.length <= 1}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 font-medium hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next problem
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
