# BeautyIntel OS

**AI-powered financial analysis for beauty businesses in Ireland.**

Upload your Fresha or bank export. Get a full P&L, expense breakdown, anomaly flags, and an AI-written financial narrative — in under 60 seconds. All processing is private and client-side.

---

## What It Does

Beauty business owners — lash techs, brow artists, nail technicians, hair stylists — work hard but often fly blind on finances. Fresha and Revolut hold the data; no tool connects them intelligently.

BeautyIntel OS solves this:

1. **Upload** your sales CSV (Fresha, Vagaro, Mindbody, Treatwell) and your bank CSV (Revolut, AIB, Bank of Ireland)
2. **Privacy review** — the app shows exactly what data it removed (names, IBANs, phone numbers) before processing
3. **Get your financial autopsy** — P&L, health score, top services, channel ROI, expense categories, anomalies, and a 12-month growth projection
4. **Optional AI narrative** — add an Anthropic API key to unlock a personalised financial report written by Claude

---

## Key Features

| Feature | Detail |
|---|---|
| Privacy-first | Strips client names, IBANs, emails, card numbers before any analysis |
| Dual mode | Rules-based (free, no API key) + AI-powered (requires Anthropic API key) |
| Multi-platform CSV | Fresha, Vagaro, Mindbody, Treatwell, Timely, Phorest, GlossGenius, Revolut, AIB, Bank of Ireland |
| P&L breakdown | Gross sales → discounts → refunds → platform fees → net revenue → net profit |
| Health score | 0–100 score across profit margin, expense visibility, platform fees, discount rate |
| Expense categorisation | 10 beauty-specific categories including Irish merchants (ESB, Eir, Tesco, Lidl) |
| Anomaly detection | Flags high uncategorised spend, excessive platform fees, duplicate subscriptions |
| Growth Engine | "The One Move" highest-ROI recommendation + 12-month projection chart |
| AI Report | Executive summary, risk factors, and 90-day action plan written by Claude |
| Export | Print-to-PDF via browser print |

---

## Getting Started

### Run locally

No build step required. Open `src/beautyintel.html` directly in a browser, or serve it locally:

```bash
npx serve src -p 3000
# then open http://localhost:3000/beautyintel.html
```

### Enable AI mode

The app works without an API key (rules-based analysis). To enable the AI-powered narrative, deploy the Cloudflare Worker with your Anthropic API key set as an environment secret:

```bash
cd worker/
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```

The API key is never exposed to the browser — all API calls are proxied through the Cloudflare Worker. This ensures credentials are kept secure and rate limiting is enforced server-side.

See `worker/README.md` for full Worker setup and deployment instructions.

### Supported CSV formats

**Sales files** — look for columns including: `date`, `service`, `gross sales`, `net sales`, `channel`, `discount`, `fee`

**Spend files** — look for columns including: `date`, `description`, `amount`, `debit`, `credit`

The app auto-detects which file is which based on column headers.

---

## Project Structure

```
beautyintel-os/
├── src/
│   └── beautyintel.html        # Main application (single-file)
├── docs/
│   ├── MasterPlan.md           # Product vision & investor narrative
│   ├── 90Day_Launch_Playbook.md # GTM execution plan
│   └── BeautyIntel_OS_Pitch.pptx
├── tests/                      # Placeholder — future unit tests
├── assets/
│   ├── css/                    # Future: extracted stylesheets
│   └── fonts/                  # Future: self-hosted fonts
├── archive/
│   └── BeautyIntel_Analyzer_Premium.html  # Previous design iteration
├── .gitignore
├── CHANGELOG.md
├── package.json
└── README.md
```

---

## Roadmap

| Version | Focus |
|---|---|
| **v0.9** *(current)* | Working prototype — full analysis pipeline, placeholder CTA |
| **v1.0** | Public launch: fix CTA, fix PDF export, add date range filter |
| **v1.1** | Irish sole-trader tax calculator (Income Tax + USC + PRSI) |
| **v1.2** | CSV robustness, error messages, mobile polish |
| **v1.5** | Backend: server-side API proxy, user accounts, saved reports |
| **v2.0** | Platform: live bank sync (Revolut API), multi-period comparison, subscription tiers |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | Vanilla HTML + CSS + JavaScript (no framework) |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) |
| Fonts | Playfair Display + DM Sans + DM Mono (Google Fonts) |
| AI | [Anthropic Claude](https://www.anthropic.com) (claude-sonnet-4-6) |
| Hosting | Any static host — Vercel, Netlify, GitHub Pages |

---

## Privacy

BeautyIntel OS is designed to be privacy-first by default:

- All CSV processing happens in the browser — no data is uploaded to any server
- Before analysis, the app strips: client names, email addresses, phone numbers, IBANs, account numbers, sort codes, card numbers
- The privacy review screen shows users exactly what was removed before they confirm
- API keys are stored only in `sessionStorage` (cleared on tab close, never in `localStorage` or cookies)
- When AI mode is used, only anonymised financial metrics and a sample of 75 stripped transactions are sent to the Anthropic API

---

## Target Market

**Primary:** Solo beauty professionals in Ireland — lash technicians, brow artists, nail technicians, spray tan artists, hair stylists operating as sole traders (€0–€100K annual revenue)

**Secondary:** Small beauty salons (2–5 staff), beauty training academy graduates entering business

**Market context:** ~500,000 solo beauty professionals in Ireland and the UK have no AI-powered financial tools. Existing options (QuickBooks, Xero) are too generic. Fresha and Treatwell are booking platforms, not financial tools.

---

## Development

```bash
# Serve locally
npx serve src -p 3000

# Lint HTML
npx htmlhint src/beautyintel.html

# Run tests (placeholder)
npm test
```

---

## License

Proprietary — All rights reserved. Not open source.

---

*BeautyIntel OS — Financial intelligence for beauty businesses.*
