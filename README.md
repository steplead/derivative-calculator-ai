# Derivative Calculator AI 🧮

A high-performance, AI-powered Calculus Solver featuring:
*   **Instant Math Engine:** SymPy backend for <200ms results.
*   **AI Explanations:** Google Gemini 2.0 Flash for step-by-step logic.
*   **Interactive Graphs:** Real-time plotting of functions and derivatives.
*   **Dual Theme:** Dark/Light mode support.
*   **Verified Accuracy:** 100% test coverage on 50+ core math problems.

## 🚀 Live Demo
**[DerivativeCalculatorAI.com](https://derivativecalculatorai.com)**

## ✅ Validation Status
**Version:** `v0.50-verified`
**Pages Verified:** 50/50
**Accuracy:** 100%

We have implemented an automated verification suite that runs against the production site:
*   `tests/verify_calculations.py`: Checks backend math accuracy against ground truth.
*   `tests/verify_live_pages.py`: Checks HTTP 200 status of all generated SEO pages.

## 🔍 Search Engine Optimization (SEO)
We have implemented a **Top-Tier SEO Architecture** designed for massive scale (1000+ pages):

*   **Programmatic SEO:** Static pages generated from `problems.json` (e.g., `/derivative-of-sin-x`).
*   **Structured Data:** Full `HowTo` and `MathSolver` JSON-LD schema for Rich Results.
*   **Crawl Highway:**
    *   **Fat Footer:** 4-column layout linking to key categories and popular problems.
    *   **Directory:** `/directory` page (linked from Header) acts as an HTML sitemap.
*   **Technical SEO:**
    *   **Canonical Tags:** auto-generated to prevent duplicate content.
    *   **Internal Linking:** "Practice More" section on every page creates a crawl mesh.

## 🛠 Tech Stack
*   **Frontend:** Next.js 15, React 19, Tailwind CSS v4.
*   **Backend:** Python, Flask, SymPy (Math), Google Gemini (AI).
*   **Deployment:** Vercel (Next.js + Python Runtime).

## 🧪 How to Test
You can verify the system yourself using the included scripts:

```bash
# Verify Math Logic (Local)
python3 tests/verify_calculations.py

# Verify Live Site Availability
python3 tests/verify_live_pages.py
```

## 🏗 Project Structure
- `app/`: Next.js App Router pages.
- `api/`: Python Flask backend (Vercel Serverless).
- `components/`: React UI components.
- `data/problems.json`: Database of 50+ math problems generating the static pages.
- `tests/`: Automated verification scripts.
