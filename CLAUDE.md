# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projects in this workspace

Two projects live here:

- **`cluade code beauty tool/`** — BeautyIntel OS, the main active project (note the typo in the folder name)
- **`execution-repo/`** — Operational templates and specs (ADRs, project specs, postmortems)

---

## BeautyIntel OS

AI-powered financial analysis for solo beauty professionals in Ireland. Users upload Fresha/bank CSVs, get a P&L breakdown, health score, anomaly flags, and an optional Claude-written financial report — all processed client-side.

### Commands

Run from `cluade code beauty tool/`:

```bash
npm run dev        # Serve locally: http://localhost:3000/beautyintel.html
npm run lint       # HTMLHint validation
npm run validate   # html-validate
npm test           # Placeholder — no tests yet; see /tests directory
```

**Node requirement:** `>=18.0.0`

No build step. The entire app is `src/beautyintel.html` — open it directly in a browser or via `npm run dev`.

### Cloudflare Worker (API proxy)

The worker lives in `worker/` and proxies Anthropic API calls from the browser. **Model selection and response limits are set in `worker/worker.js`:** `claude-sonnet-4-6` with `max_tokens: 4096`. To change the model or token limit, edit the worker code, not the HTML.

```bash
# Deploy worker
wrangler deploy

# Set API key secret (never stored in wrangler.toml)
wrangler secret put ANTHROPIC_API_KEY
```

The worker enforces rate limiting (10 requests/IP/hour) and handles CORS.

### Architecture

**Single-file design:** All CSS, HTML, and JS are inline in `src/beautyintel.html` (~1,875 lines). There is no bundler or framework — this is intentional for simplicity and zero-dependency deployment to any static host.

**Navigation:** No router. Pages are `<div class="page">` elements; show/hide by toggling the `.active` class. New screens must follow this `showPage(id)` pattern.

**CSS design tokens:** Use custom properties for all colors (`--ink`, `--paper`, `--cream`, `--gold`, `--blush`, `--sage`, `--danger`, `--success`, `--amber`, `--muted`, `--border`). Do not hardcode hex values — this breaks theming consistency. Any UI work must respect these tokens.

**Processing pipeline (client-side only):**
1. CSV auto-detection — identifies file type (Fresha, Revolut, AIB, etc.) from column headers
2. Privacy stripping — removes names, IBANs, emails, phone numbers, card numbers before analysis
3. Financial analysis — P&L calculation, expense categorisation (10 beauty-specific categories), health score (0–100)
4. Rules-based analyzer — runs free, no API key required
5. AI analyzer — sends anonymised metrics + up to 75 stripped transactions to Anthropic API; generates executive summary, risk factors, and 90-day action plan

**Two analysis modes:**
- **Free/rules-based:** Always runs; no API key needed
- **AI-powered:** Requires Anthropic API key, stored only in `sessionStorage` (never `localStorage`)

**Supported CSV platforms:** Fresha, Vagaro, Mindbody, Treatwell, Timely, Phorest, GlossGenius (sales); Revolut, AIB, Bank of Ireland (spend)

**Expense categories** include Irish-specific merchant mappings (ESB, Eir, Tesco, Lidl, etc.)

**Charts:** Chart.js 4.4 (CDN), used for P&L bar charts and 12-month growth projections

**AI model:** `claude-sonnet-4-6`

**Repository:** `https://github.com/stephenmantle/beautyintel-os.git` — use `gh` CLI for issue/PR operations.

**Documentation:**
- `docs/masterplan.md` — Product vision and investor narrative
- `docs/playbook.md` — 90-day GTM strategy
- `CHANGELOG.md` — Release notes; update when features ship
- `archive/BeautyIntel_Analyzer_Premium.html` — v0.1 prototype; do not edit

### Privacy constraints

No data leaves the browser except when AI mode is explicitly triggered. When it is, only anonymised financial metrics and stripped transactions are sent — never raw CSV data. The privacy review screen shows the user what was removed before they confirm analysis. Do not change this behaviour.

### Roadmap context

- **v1.0:** Fix CTA, fix PDF export, add date range filter
- **v1.1:** Irish sole-trader tax calculator (Income Tax + USC + PRSI)
- **v1.2:** CSV robustness, error messages, mobile polish
- **v1.5:** Server-side API proxy, user accounts, saved reports
- **v2.0:** Live bank sync (Revolut API), multi-period comparison, subscription tiers

---

## Git Workflow (All Projects)

**Always commit and push work to GitHub to prevent data loss.** This ensures every change is tracked and preserved.

### Commit Strategy

1. **Commit frequently** — after each complete feature, bug fix, or logical unit of work
2. **Use clear, descriptive messages** — follow the format below
3. **Never amend published commits** — create new commits instead
4. **Push to remote after each commit** — `git push origin main`

### Commit Message Format

```
<type>: <subject>

<body (optional)>

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Types:**
- `fix:` — Bug fixes (e.g., "fix: resolve profitPerDay calculation")
- `feat:` — New features (e.g., "feat: add tax year selector")
- `refactor:` — Code improvements without behavior change
- `docs:` — Documentation updates
- `test:` — Test additions/fixes

**Examples:**
```
fix: prevent listener stacking on tax year selector

- Replace setTimeout with event delegation
- Single document-level listener prevents accumulation
- Fixes memory leak on re-analysis

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

```
feat: enhance Irish tax calculator with 2025 bands

- Add TAX_BANDS config for easy year updates
- Include 2025 tax rates (€48k band, €4k credits)
- Add year selector UI for dynamic calculations
- Improve breakdown table with net take-home

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

### Push to GitHub

After committing, always push:
```bash
git push origin main
```

This ensures:
- ✅ Work is backed up on GitHub
- ✅ Changes are visible in the repo history
- ✅ Team can see latest status
- ✅ Never lose work due to local issues

### Review Before Committing

```bash
git status              # See what changed
git diff                # Review all changes
git add <file>          # Stage changes
git commit -m "msg"     # Commit with message
git push origin main    # Push to GitHub
```
