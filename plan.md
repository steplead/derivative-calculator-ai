To assure the format is **not broken** when you save the file, you must follow these two rules:

1.  **Use the "Copy" Button:** Do not highlight the text with your mouse. Click the "Copy" button at the top right of the code block below. This preserves the hidden formatting characters (like the `|` lines for tables and the `[ ]` brackets for checkboxes).
2.  **Check the Syntax:** When you paste it into your editor (like VS Code or Notepad), look for these specific characters:
    *   **Tables:** You should see vertical bars `|` separating the words (e.g., `| Item | Cost |`).
    *   **Checkboxes:** You should see brackets with a space inside (e.g., `- [ ]`).

Here is the **final, verified block**. I have double-checked the spacing in Sections 5-9 to ensure they render perfectly on GitHub and VS Code.

```markdown
# Project Master Plan: DerivativeCalculatorAI.com

**Version:** 1.0  
**Domain:** [DerivativeCalculatorAI.com](https://derivativecalculatorai.com)  
**Goal:** Build a high-performance, mobile-first math solver that uses Programmatic SEO to capture traffic and AI to provide superior step-by-step explanations.

---

## 1. The Strategy
We are not building a static calculator. We are building a **Dynamic Answer Engine**.
*   **Core Value:** Speed + "Human-like" Explanations (via AI).
*   **Traffic Source:** Programmatic SEO. We will generate 1,000+ landing pages for specific math problems (e.g., `domain.com/derivative-of-sin-x`).
*   **Monetization:** Display Ads (Phase 2) + Affiliate Lead Gen (Phase 3).

---

## 2. Tech Stack (The "Free Tier" Architecture)

| Component | Technology | Reasoning | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js 14+ (App Router)** | Best for SEO, speed, and dynamic routing. | Free |
| **Styling** | **Tailwind CSS** | Fast development, easy Dark Mode. | Free |
| **Hosting** | **Vercel** | Optimized for Next.js, Global CDN, Free SSL. | Free |
| **Math Engine** | **Python + SymPy** | Open-source standard for symbolic math. | Free |
| **AI Engine** | **Google Gemini API** | Fast, high-quality explanations. Free tier available. | Free / Scale |
| **Graphing** | **Function-Plot.js** | Lightweight JavaScript graphing library. | Free |
| **Data Storage**| **JSON File** (MVP) / **Supabase** (Scale) | Stores the list of SEO keywords/problems. | Free |

---

## 3. Development Roadmap

### Phase 1: Environment Setup
1.  **Repo:** Initialize GitHub repository `derivative-calculator-ai`.
2.  **Install:** `npx create-next-app@latest` (TypeScript, Tailwind, App Router).
3.  **Config:** Create `vercel.json` to enable Python Serverless Functions.
    ```json
    {
      "rewrites": [{ "source": "/api/(.*)", "destination": "/api/index.py" }]
    }
    ```
4.  **Local Dev Setup:** Install Vercel CLI (`npm i -g vercel`) and run `vercel dev` to allow Python and Next.js to work together locally.

### Phase 2: The Math & AI Backend
Create `api/index.py` (Flask-like Python script running on Vercel).
*   **Input:** Receives math string (e.g., `x^2`).
*   **Step 1:** Uses `SymPy` to calculate the derivative and convert to LaTeX.
*   **Step 2:** Sends result to Google Gemini with prompt: *"Explain the derivative rule used for {expression} in one simple sentence."*
*   **Output:** JSON object `{ "solution": "2x", "steps": "...", "ai_explanation": "..." }`.

### Phase 3: The Frontend (Mobile First)
*   **Input Component:** Large, easy-to-tap text input.
*   **Math Display:** Use `react-latex-next` or `katex` to render beautiful math equations.
*   **Graph Component:** Visualizes the function using `function-plot`.
*   **The "AI Badge":** Visual hook showing "Powered by AI".

### Phase 4: Programmatic SEO Engine (The Traffic Generator)
1.  **Data Source:** Create `data/problems.json` containing top 500 keywords.
    ```json
    [
      { "slug": "derivative-of-sin-x", "formula": "sin(x)", "h1": "Derivative of Sin(x)" },
      { "slug": "derivative-of-ln-x", "formula": "ln(x)", "h1": "Derivative of Ln(x)" }
    ]
    ```
2.  **Dynamic Route:** Create `app/[slug]/page.tsx`.
    *   Reads the `slug` from URL.
    *   Finds data in JSON.
    *   **Pre-renders** the page with the calculator already filled.
    *   Injects dynamic Title Tags & Meta Descriptions.
3.  **Sitemap:** Script to auto-generate `sitemap.xml` linking to all 500 pages.

---

## 4. File Structure Reference

```text
/derivative-calculator-ai
├── app
│   ├── api
│   │   └── index.py           # Python Math Engine (SymPy + Gemini)
│   ├── [slug]                 # Dynamic SEO Pages
│   │   └── page.tsx           # Template for specific problems
│   ├── layout.tsx             # Global HTML shell (Navbar/Footer)
│   └── page.tsx               # Homepage (General Calculator)
├── components
│   ├── Calculator.tsx         # Main UI Interface
│   ├── MathDisplay.tsx        # LaTeX Renderer
│   ├── Graph.tsx              # Function Plotter
│   └── AdPlaceholder.tsx      # Empty divs for future ads
├── data
│   ├── problems.json          # List of 500+ SEO math problems
├── public
│   └── sitemap.xml            # Generated sitemap
├── styles
│   └── globals.css            # Tailwind Imports
├── requirements.txt           # Python dependencies (sympy, google-generativeai, Flask)
└── vercel.json                # Serverless config
```

---

## 5. Launch Checklist

- [ ] **Mobile Check:** Do buttons look good on iPhone/Android?
- [ ] **Dark Mode:** Is it easy on the eyes? (Slate-900 background).
- [ ] **Speed:** Does the answer appear in <1 second?
- [ ] **SEO:** Visit `domain.com/derivative-of-x` -> Does the browser tab title say "Derivative of x"?
- [ ] **Analytics:** Install Vercel Analytics or Google Analytics 4.
- [ ] **Indexing:** Submit `sitemap.xml` to Google Search Console.

---

## 6. Marketing & Growth

*   **Day 1:** Submit to Google Search Console.
*   **Month 1:** Create "Homework Hack" videos on TikTok/Shorts using the tool.
*   **Month 2:** Reach out to 50 education blogs to embed your "Widget" (Backlinks).
*   **Month 3:** Analyze traffic. If "Trig Derivatives" are popular, generate 500 more Trig pages.

---

## 7. Monetization Plan

1.  **Ads (Phase 1 - Traffic > 10k):**
    *   Apply for **Ezoic** (better than AdSense for education sites).
    *   Placements: Sticky footer, Sidebar, Top Banner.
2.  **Affiliates (Phase 2):**
    *   "Need a Tutor?" button linking to **Wyzant** or **Chegg**.
3.  **Features (Phase 3):**
    *   "Download PDF Solution" ($1 micro-transaction).

---

## 8. Estimated Costs (Monthly)

| Item | Cost | Notes |
| :--- | :--- | :--- |
| **Domain** | $1.00 | Averaged yearly cost |
| **Vercel Hosting** | $0.00 | Free Hobby Tier |
| **Gemini API** | $0.00 | Free Tier (Rate limited but sufficient for start) |
| **Marketing** | $0.00 | DIY Content |
| **TOTAL** | **~$1.00** | **Low Risk, High Reward** |

---

## 9. Legal & Compliance (Mandatory for Ads)

*   **Privacy Policy:** You must disclose that you use cookies (for Analytics) and third-party vendors (ads).
*   **Terms of Service:** Standard disclaimer that the calculator results are for educational purposes and you are not responsible for failed exams.
*   **Cookie Consent:** Add a simple "Accept Cookies" banner (GDPR compliance) if you have visitors from Europe.
*   **Contact Page:** A simple email address (`contact@derivativecalculatorai.com`) builds trust with Google and users.
```