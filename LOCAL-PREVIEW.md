# Previewing locally (no publishing needed)

## One-time setup
1. Install Node.js LTS from https://nodejs.org (if not already installed).
2. Double-click `start-local.bat` in this folder.
   - First run: it asks you to log in to Vercel and link this folder to your
     existing project. Accept the defaults.
3. Pull your API key so live data works locally:
   - Open a terminal in this folder and run: `npx vercel env pull .env.local`
   - This downloads ALPHA_VANTAGE_API_KEY from your Vercel project.

## Every time after that
1. Double-click `start-local.bat`.
2. Open http://localhost:3000 in your browser.
3. Edit any file, save, refresh the browser — changes appear instantly.
4. When you're happy, publish once: `git push` (or `npx vercel deploy`).

## Notes
- `vercel dev` runs the serverless API (`api/markets-hub.js`) and the
  `vercel.json` rewrites locally, so the site behaves exactly like production.
- Pages that don't need live data (learn.html, manifesto.html, files in
  `reports/`) also work by just double-clicking them.
- Stop the server by closing the window or pressing Ctrl+C.
