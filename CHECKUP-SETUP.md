# Marketing Check-Up: setup guide

**Bottom line:** the quiz works on the site as soon as this is merged. It **saves answers only once the site is served by Cloudflare Pages** (free). GitHub Pages can only serve files; it can't run code or store anything. Until you switch, visitors still get their results, and the "Want me to look at your business?" step hands off to a pre-filled email to hello@putnamleads.com, so no lead is lost.

Everything here uses Cloudflare's free plan: Pages, Pages Functions and a D1 database. There are no paid services and no third-party trackers.

## What lives where

| Path | What it is | Public? |
|---|---|---|
| `index.html`, `assets/`, `robots.txt` | The website (the quiz code is `assets/quiz.js` and `assets/quiz-schema.js`) | Yes |
| `functions/api/quiz.js` | Saves answers (`POST /api/quiz`) | Runs on the server only |
| `functions/api/quiz/contact.js` | Saves the optional contact info (`POST /api/quiz/contact`) | Server only |
| `functions/api/admin/index.js` | Password-protected summary page (`/api/admin`) | Server only |
| `functions/api/admin/export.js` | Password-protected CSV download (`/api/admin/export`) | Server only |
| `lib/` | Shared server helpers | Server only |
| `migrations/0001_checkup.sql` | Creates the database tables | Never published |
| `scripts/build.mjs` | Copies only the public files into `dist/` for Cloudflare | Never published |

## Step 1: Create the Cloudflare Pages project (in the browser, about 5 minutes)

1. Sign in at dash.cloudflare.com, or create a free account.
2. Go to **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git**.
3. Pick the **ks104-ops/plg-site** repository.
4. Fill in exactly:
   - Project name: `putnamleads`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click **Save and Deploy**. This only creates a preview address (`putnamleads.pages.dev`). It does **not** change putnamleads.com.

> Use the browser for this step, not `wrangler pages project create`. A project made from the command line can never be connected to GitHub afterwards.

## Step 2: Create the database and set your admin password (Windows)

Open **PowerShell** and run these one at a time. If you already have the repo on your computer, skip the first two lines and `cd` into your copy instead.

```
git clone https://github.com/ks104-ops/plg-site.git
```
```
cd plg-site
```
```
git checkout claude/hopeful-cray-vmasa3
```
```
npm.cmd install
```
```
npx.cmd wrangler login
```
A browser window opens. Click **Allow**.
```
npx.cmd wrangler d1 create plg-checkup --binding DB --update-config
```
This creates the free database and adds it to `wrangler.toml` for you. If it asks for a location, pick **enam** (Eastern North America).
```
npx.cmd wrangler d1 migrations apply plg-checkup --remote
```
Type `y` when it asks. This creates the tables.
```
npx.cmd wrangler pages secret put ADMIN_PASSWORD --project-name putnamleads
```
It asks you to type the password. Use **12 or more characters**, and keep it in your password manager. It is never shown, printed or stored in the code.
```
git add wrangler.toml
```
```
git commit -m "Connect the Check-Up database"
```
```
git push
```

## Step 3: Point putnamleads.com at Cloudflare Pages (the actual switch)

1. In Cloudflare, open the **putnamleads** Pages project, then **Custom domains**, then **Set up a custom domain**, then enter `putnamleads.com`. Follow the DNS instructions it shows.
2. Check that https://putnamleads.com loads, and take the quiz once yourself.
3. After it works, go to GitHub: **ks104-ops/plg-site**, then **Settings**, then **Pages**, and turn GitHub Pages off so there's only one copy of the site. (Merging to `main` still auto-deploys, now through Cloudflare.)

## Seeing the results

- **Summary page:** https://putnamleads.com/api/admin. Your browser asks for a username and password. Type any username (for example `kyle`) and the `ADMIN_PASSWORD` you set.
- **Spreadsheet:** click **Download all responses (CSV)** on that page, or go to https://putnamleads.com/api/admin/export. It opens in Excel or Google Sheets.
- Ten wrong passwords in an hour locks that visitor out for the rest of the hour.

To change the password later, run the `secret put` command from Step 2 again.

## Spam protection and privacy

- **Hidden trap field:** real people never see it. Bots that fill it in, or finish the quiz in under 4 seconds, get a normal-looking reply and nothing is saved.
- **Rate limit:** 8 quiz submissions and 5 contact submissions per visitor per hour.
- **Same-site check:** the server only accepts posts sent from the site's own pages.
- **Server-side checks:** every answer must be one of the real choices, and text is length-limited. Contact info must look like a phone number or an email.
- **No raw IP addresses are stored.** Rate limiting uses a scrambled one-way code (a hash) that can't be turned back into an IP, and those rows are deleted after a day.
- **Contact info is optional** and can only be attached once, by the visitor who just finished the quiz.
- **The CSV is protected against spreadsheet formula tricks.**

## Optional: try it on your own computer

```
npm.cmd run db:migrate:local
```
```
notepad .dev.vars
```
In Notepad, type one line, `ADMIN_PASSWORD=` followed by any test password of 12+ characters, then save. This file is ignored by git and never uploaded.
```
npm.cmd run dev
```
Then open http://localhost:8788.
