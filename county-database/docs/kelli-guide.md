# How to Use Surplus Secure — Kelli's Guide

Welcome! This guide explains everything you need to know about using and updating Surplus Secure. No coding knowledge required.

---

## The App

Your main tool is the Surplus Secure web app. It lives at a URL like `https://surplus-secure.your-subdomain.workers.dev` (Ramayan will give you the exact link).

### What you can do in the app:
- **Search and filter** all 83 Michigan counties
- **Click any county** to see details and edit its configuration
- **Track FOIA status** — which counties you've submitted requests to
- **Set priority tiers** — High, Medium, Low for each county
- **Generate FOIA letters** — fill in the blanks, copy, and send
- **Track your pipeline** — where each county is in the recovery process
- **Add notes** — anything specific to a county's claim process

### Your data saves automatically
When you click "Save Changes" in the app, your operational data (FOIA methods, tiers, notes, pipeline stages) saves to your browser. This means:
- ✅ Your data is there every time you open the app on the same computer/browser
- ⚠️ If you clear your browser data or use a different computer, your operational data resets
- ✅ The base county data (names, phones, addresses) always loads fresh from the repository

---

## Updating County Data

The county data (treasurer names, phone numbers, addresses, FGU status) lives in a file on GitHub. When you update this file, the app automatically redeploys with the new data.

### Step by step:

1. **Go to GitHub** — Ramayan will share the repository link with you
2. **Navigate to** `data/counties.json`
3. **Click the pencil icon** (✏️) in the top right of the file to edit
4. **Find the county** you need to update — use Ctrl+F (or Cmd+F on Mac) to search
5. **Make your change** — for example, change a treasurer's name:
   ```
   Before: "treasurer": "Old Name"
   After:  "treasurer": "New Name"
   ```
6. **Be careful with formatting:**
   - Keep the quotes around text values
   - Keep the commas between fields
   - Don't delete any curly braces `{ }` or square brackets `[ ]`
7. **Scroll down** and click **"Commit changes"**
8. Add a brief note like "Updated Wayne County treasurer" and click **"Commit changes"** again
9. **Wait about 60 seconds** — the app automatically rebuilds and deploys

### What if I mess up the formatting?
Don't worry — GitHub keeps a history of every change. Ramayan can easily revert to a previous version. If you're unsure about a change, just ask before committing.

---

## Updating FOIA Templates

The FOIA letter templates are in `data/foia-templates.json`. Same editing process as county data. The templates use placeholder variables in curly braces like `{county_name}` and `{treasurer_name}` — the app fills these in automatically when you generate a letter.

---

## Updating the Playbook

The business playbook and customer journey docs are in the `docs/` folder:
- `docs/playbook.md` — Full operations guide
- `docs/customer-journey.md` — Step-by-step customer lifecycle

These are written in Markdown, which is basically plain text with some simple formatting:
- `# Heading` makes a big heading
- `## Smaller Heading` makes a smaller heading
- `**bold text**` makes text bold
- `- item` makes a bullet point
- `| column | column |` makes a table

GitHub shows these files nicely formatted. Just click the pencil to edit, make your changes, and commit.

---

## Common Tasks

### "A county got a new treasurer"
1. Go to `data/counties.json` on GitHub
2. Search for the county name
3. Update the `treasurer` field and `phone` if needed
4. Commit the change

### "I need to add notes about a county's FOIA quirks"
1. Open the app
2. Click the county
3. Type your notes in the "Claim Process Notes" field
4. Click "Save Changes"

### "I want to change priority tiers"
1. Open the app
2. Click the county
3. Change the "Priority Tier" dropdown
4. Click "Save Changes"

### "I need to generate a FOIA letter"
1. Open the app
2. Click the county
3. Go to the FOIA section
4. Click "Generate Letter"
5. Fill in any remaining blanks
6. Copy and send via the county's preferred method

### "The app looks wrong or broken"
- Try refreshing the page (Ctrl+R or Cmd+R)
- Try clearing your browser cache for this site
- Contact Ramayan if the issue persists

---

## Weekly Checklist

- [ ] Monday: Review pipeline statuses. Follow up on pending FOIAs past 5 business days.
- [ ] Tuesday–Wednesday: Process outreach letters. Handle client responses.
- [ ] Thursday: Prepare and submit new claims. Gather documentation.
- [ ] Friday: Update county data if anything changed. Review next week's priorities.

---

## Questions?
Reach out to Ramayan — he manages the technical infrastructure behind the app.
