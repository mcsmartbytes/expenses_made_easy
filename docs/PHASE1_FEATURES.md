# Phase 1 Additions

This update adds four high‑value enhancements without requiring backend changes or builds.

## 1) Auto‑Categorization Rules
- Location: Settings → Auto‑Categorization Rules (Dashboard → ⚙️ Auto‑Categorization Rules)
- Define rules like: If description contains "UBER" → Category: Transportation, Profile: Business (profile optional).
- Rules apply when adding expenses and after OCR. User selections always win.

## 2) Enhanced Receipt OCR Autofill
- Receipt scanning populates merchant, date, subtotal, tax, tip, and total when possible.
- After scanning, rules are evaluated to set a suggested category.

## 3) Monthly Budgets
- Location: Settings → Monthly Budgets (Dashboard → 💵 Monthly Budgets)
- Set a monthly amount per category per profile.
- Dashboard shows a quick progress bar for up to 3 budgets.
- When saving an expense, soft alerts warn at 80% and 100% of budget.

## 4) Year‑End Tax Pack (ZIP)
- Location: Reports → set date range → “📦 Year‑End Tax Pack (ZIP)”
- Generates a ZIP containing:
  - expenses.csv
  - mileage.csv
  - manifest.json (metadata)
  - receipts/ (best‑effort thumbnails from public URLs when available)

Notes
- Rules and budgets are stored locally on device via AsyncStorage and do not require database changes.
- Receipts in tax pack are best‑effort; private or unavailable URLs will be skipped, but are still referenced in expenses.csv.

