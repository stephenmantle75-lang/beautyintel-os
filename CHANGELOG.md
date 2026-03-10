# Changelog

All notable changes to BeautyIntel OS are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned for v1.0
- Connect CTA button to real Calendly/booking link
- Fix print-to-PDF layout (dark background, chart rendering)
- Date range filter on uploaded data
- Improved CSV error handling with user-facing messages
- **Legal:** Add privacy policy, terms of service, and financial advice disclaimers
- **Infrastructure:** Deploy Cloudflare Worker to production
- **Market validation:** Conduct 5 customer discovery calls with salon owners

---

## [Audit] — 2026-03-07

**ClaroSi Business Readiness Audit completed.** See `AUDIT.md` for full assessment.

**Overall Score:** 5.0/10 (Pre-revenue)
- ✅ Product capability: 7/10 (strong)
- 🔴 Sales & acquisition: 3/10 (critical blocker)
- 🔴 Legal & compliance: 4/10 (exposure)
- ⚠️ Market validation: 0/10 (untested)

**Key findings:**
- Well-built product; zero customer traction
- No customer acquisition strategy defined
- Legal framework gaps (no privacy policy, disclaimers, or DPA)
- Market fit unknown (1 user: founder)

**Immediate actions:**
1. Run 5 customer discovery calls (Week 1)
2. Deploy Cloudflare Worker (Week 1)
3. Add legal disclaimers to app (Week 1)
4. Validate pricing with market (Week 2)
5. Get first paying customer by Day 45

---

## [0.9.0] — 2026-02-20

### Added
- Full financial analysis pipeline: Upload → Privacy Review → Results
- Dual analysis mode: Rules-based (free) and AI-powered via Anthropic API
- Privacy stripping layer removes client names, IBANs, phone numbers, email addresses before processing
- CSV auto-detection: identifies sales vs. spend files from column headers
- Drag-and-drop file upload for sales (Fresha, Vagaro, Mindbody, Treatwell) and spend (Revolut, AIB, Bank of Ireland)
- P&L breakdown: gross sales, discounts, refunds, platform fees, net revenue, net profit
- Business Health Score (0–100) across four dimensions: profit margin, expense visibility, platform fee rate, discount rate
- Stacked bar visualisation: "where every euro went"
- Channel ROI comparison (Fresha marketplace vs. direct bookings)
- Top services by revenue with average transaction value
- Expense categorisation: 10 beauty-specific categories (products, platform fees, software, marketing, rent, loans, transport, training, insurance, food)
- Anomaly detection: high uncategorised spend, excessive platform fees, duplicate subscription detection
- Growth Engine tab: "The One Move" highest-ROI recommendation + reinvestment opportunities table
- 12-month profit projection chart (current trajectory vs. optimised) using Chart.js
- AI Report tab: Executive Summary, What's Working, Risk Factors, 90-Day Action Plan
- Copy-to-clipboard for AI report
- Basic print/export via `window.print()`
- Fully responsive layout (mobile breakpoint at 900px)
- Sticky results header with live key metrics
- Initial project structure: `/src`, `/docs`, `/tests`, `/assets`, `/archive`

### Architecture
- Single-file HTML app (CSS + JS + HTML inline) — no build step required
- All processing is client-side; no data leaves the browser
- Anthropic API called directly from browser with `anthropic-dangerous-direct-browser-access` header
- API key stored in `sessionStorage` only (cleared on tab close)

---

## [0.1.0] — 2026-02-19 *(pre-history)*

Initial prototype: `BeautyIntel_Analyzer_Premium.html`

- Basic CSV upload (bank + booking platform)
- Expense categorisation with Irish-specific merchants
- Revenue/expense breakdown
- Dark blue/cyan design system
- No AI integration, no privacy screen
- Archived to `/archive/` — superseded by v0.9.0
