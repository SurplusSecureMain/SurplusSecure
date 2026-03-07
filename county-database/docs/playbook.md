# Surplus Secure — Business Operations Playbook

> **Last updated:** March 2026
> **Maintained by:** [Your name]
> **Confidential** — This document contains proprietary business methodology.

---

## 1. Business Overview

### What We Do
Surplus Secure recovers unclaimed surplus funds for former property owners whose homes were sold at Michigan tax foreclosure auctions for more than the amount owed. Under Michigan law (and reinforced by the U.S. Supreme Court in *Tyler v. Hennepin County*, 2023), former owners are entitled to the surplus — the difference between what they owed and what the property sold for.

Most former owners don't know this money exists. We find them, inform them, and handle the recovery process.

### Legal Foundation
- **MCL 211.78t** — Michigan's statute governing surplus fund distribution from tax foreclosure sales
- **Rafaeli, LLC v. Oakland County (2020)** — Michigan Supreme Court ruling establishing that retaining surplus constitutes an unconstitutional taking
- **Tyler v. Hennepin County (2023)** — U.S. Supreme Court unanimous ruling reinforcing property owners' right to surplus
- **Pung v. Isabella County** — Currently pending at SCOTUS; could further clarify retroactive claims

### Revenue Model
We charge a **contingency fee** — a percentage of the recovered surplus. We only get paid when the client gets paid.

| Surplus Amount | Fee Percentage | Rationale |
|---------------|---------------|-----------|
| Under $1,000 | Evaluate case-by-case | Cost to recover may exceed fee |
| $1,000–$5,000 | [Set your rate] | Standard recovery |
| $5,000–$25,000 | [Set your rate] | Higher value, same effort |
| Over $25,000 | [Set your rate] | Consider volume discount |

> **Note:** Fee structures are governed by Michigan law. Ensure your agreement complies with any applicable regulations. Consult legal counsel before finalizing.

---

## 2. Operations Calendar

### Annual Cycle
Michigan tax foreclosure auctions follow a predictable annual rhythm:

| Month | Activity |
|-------|----------|
| **January–March** | Tax delinquency notices go out. Research upcoming foreclosure lists. |
| **March–April** | Foreclosure petitions filed by treasurers. Review county foreclosure lists for upcoming auctions. |
| **May–July** | Redemption period for property owners. No action for us — owners can still pay and reclaim. |
| **August–November** | **Auction season.** Most counties hold sales during this window. Monitor results. |
| **Post-Auction** | Surplus is generated. Begin FOIA process for surplus records. |
| **Ongoing** | Process FOIA responses, conduct outreach, file claims, recover funds. |

### Weekly Routine (Suggested for Kelli)

| Day | Focus |
|-----|-------|
| **Monday** | Review pipeline. Update county statuses. Follow up on pending FOIAs. |
| **Tuesday–Wednesday** | Outreach: send letters, make follow-up calls, process responses. |
| **Thursday** | Claims processing: prepare and submit claims, gather documentation. |
| **Friday** | Data maintenance: update county database, process incoming data, planning. |

---

## 3. County Prioritization Framework

Not all 83 Michigan counties are worth equal effort. Prioritize based on:

### Tier Criteria

**High Priority**
- Foreclosure volume > 100 properties/year
- Known surplus retention (county keeps the money instead of returning it)
- County FGU (not State) — easier to work with directly
- Responsive to FOIA requests
- Examples: Wayne, Oakland, Macomb, Genesee, Saginaw, Kent

**Medium Priority**
- Foreclosure volume 25–100 properties/year
- Mixed surplus return history
- Moderate FOIA responsiveness
- Examples: Kalamazoo, Muskegon, Jackson, Bay, Berrien

**Low Priority**
- Foreclosure volume < 25 properties/year
- Already returns surplus proactively
- State FGU (must go through Lansing)
- Remote/low-population counties
- Examples: Most UP counties, Keweenaw, Luce, Oscoda

### State FGU Counties (Route Through Lansing)
These counties have delegated foreclosing governmental unit status to the Michigan Department of Treasury: Branch, Clinton, Iosco, Livingston, Mecosta. All FOIA and claims go through the state office at 430 W. Allegan Street, Lansing, MI 48922, phone 517-335-7487.

---

## 4. FOIA Process — Step by Step

### Before Submitting
1. Open the Surplus Secure app → find the target county
2. Check the FOIA Method field (Portal, Email, Form, or Mail)
3. If not set, research the county's FOIA process (check county website or call)
4. Update the county record with the correct method and any portal URLs

### Drafting the Request
1. Use the **Surplus Funds List Request** template (in the app or in `data/foia-templates.json`)
2. Fill in all variables: county name, treasurer name, year range
3. Year range: typically request 3-5 years of data
4. Review the letter for accuracy before sending

### Submitting
- **Portal:** Upload through the county's FOIA portal (save confirmation number)
- **Email:** Send to the identified FOIA email address (request read receipt)
- **Form:** Complete the county's specific FOIA form and submit with your letter
- **Mail:** Send certified mail with return receipt to the treasurer's address

### Tracking
1. Record the submission date in the app
2. Set a calendar reminder for Day 6 (5 business days + 1)
3. If no response by Day 6, send the follow-up template
4. If still no response by Day 15, consider a FOIA appeal

### Handling Responses
- **Complete data received:** Move to Data Processing stage
- **Partial data:** File a clarification request citing your original FOIA
- **Denial:** Review the stated reason; consider FOIA appeal under MCL 15.240
- **Excessive fee quote:** Negotiate; request electronic records; narrow scope if needed

---

## 5. Client Communication Standards

### Initial Outreach Letter
The first letter is the most important communication in the entire process. Get this right.

**Must include:**
- Your full legal name and business name
- Your physical mailing address
- Your phone number and email
- A clear, plain-language explanation of why you're contacting them
- The approximate surplus amount (if you choose to disclose)
- An explanation of your fee structure
- A clear statement that there's no obligation

**Must NOT include:**
- Urgent or pressuring language ("act now," "limited time")
- Misleading claims about your role (don't imply you're a government agent)
- Guarantees of specific outcomes
- Any language that could be construed as practicing law without a license

### Ongoing Communication
- Respond to client inquiries within 1 business day
- Provide monthly status updates on pending claims
- Document all communications in the case file
- Be honest about timelines — under-promise and over-deliver

---

## 6. Legal Compliance Checklist

> **Disclaimer:** This playbook is not legal advice. Consult with a licensed attorney to ensure compliance with all applicable laws and regulations.

### Key Compliance Areas
- [ ] Representation agreement reviewed by legal counsel
- [ ] Fee structure complies with Michigan regulations
- [ ] Business properly registered in Michigan
- [ ] FOIA requests comply with MCL 15.231 et seq.
- [ ] Client communications do not constitute unauthorized practice of law
- [ ] Privacy and data handling meets applicable requirements
- [ ] Records retention policy established

### Important Legal Boundaries
- **You are not a lawyer.** You help clients navigate a process. If legal questions arise, refer to an attorney.
- **You are not a government agent.** Never imply any official capacity.
- **Fee transparency.** Your fee must be clearly stated before any agreement is signed.
- **No false urgency.** Don't create artificial deadlines to pressure decisions.

---

## 7. Tools & Systems

| Tool | Purpose | Access |
|------|---------|--------|
| **Surplus Secure App** | County database, FOIA tracking, pipeline management | [Your workers.dev URL] |
| **GitHub Repository** | Data updates, playbook edits, version control | Private repo |
| **Email** | FOIA submissions, client correspondence | Standard email |
| **Calendar** | Follow-up reminders, auction date tracking | Google/Outlook |
| **Spreadsheet** | FOIA data processing, prospect ranking | Google Sheets/Excel |

### Updating County Data
1. Go to the GitHub repository
2. Navigate to `data/counties.json`
3. Click the pencil icon to edit
4. Make your changes (the file is formatted JSON — be careful with commas and quotes)
5. Click "Commit changes" at the bottom
6. The app automatically redeploys within ~60 seconds

### Updating This Playbook
Same process — edit the markdown files in the `docs/` folder directly on GitHub.

---

## 8. Scaling Considerations

### Current State: Solo Operator
Kelli manages the full pipeline — research, FOIA, outreach, claims, recovery. This works for 10-15 active counties.

### Next Phase: With VA Support
When volume justifies it, certain tasks can be delegated:
- **Delegatable:** Data entry, letter printing/mailing, skip-tracing, calendar management, follow-up tracking
- **Not delegatable:** Client calls, claim filing, FOIA strategy decisions, fee negotiations, legal compliance

### Volume Triggers for Scaling
- Processing more than 20 FOIA responses per month
- More than 50 active prospects in the pipeline
- Follow-up tasks consistently getting missed
- Client response time exceeding 1 business day

### Future Automation Opportunities
- Automated FOIA submission for portal-based counties
- Skip-tracing API integration for owner lookup
- Automated outreach letter generation and mailing
- Pipeline dashboard with email notifications
- County data refresh alerts based on election cycles (treasurers change after elections)

---

## 9. Risk Management

### Biggest Risks

| Risk | Mitigation |
|------|------------|
| County changes FOIA process | Quarterly data refresh reminders (automated) |
| New legislation changes surplus rules | Monitor Michigan legislature; subscribe to relevant alerts |
| Competitor enters market | Speed matters — be first to file FOIAs post-auction season |
| Client dispute over fees | Clear agreement upfront; transparent accounting; keep all documentation |
| County refuses to pay valid claim | Escalate through legal channels; document everything |
| Data breach / privacy issue | Minimize data retention; secure storage; no unnecessary PII |

### Competitive Advantage
Your advantages are **speed** (automated county intelligence), **systematic coverage** (83-county database), and **relationships** (building rapport with county treasurers through professional, consistent interactions). These compound over time and are difficult for competitors to replicate.
