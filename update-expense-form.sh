#!/bin/bash
echo "Backing up current file..."
cp app/expenses/new/page.tsx app/expenses/new/page.tsx.backup

echo "Downloading updated expense form with OCR..."
curl -o app/expenses/new/page.tsx https://raw.githubusercontent.com/mcsmartbytes/expenses_made_easy/main/app/expenses/new/page.tsx

echo "✅ Done! The OCR scan button should now appear."
echo "Run: git diff app/expenses/new/page.tsx to see changes"
