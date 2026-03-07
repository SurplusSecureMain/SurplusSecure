# Surplus Secure — Customer Journey Map

> **Who is the "customer"?** The former property owner who lost their home to tax foreclosure but is owed surplus funds. They don't know they're owed money. Our job is to find them, inform them, and recover what's theirs.

---

## Stage 1: County Intelligence (Internal — Before Any Customer Contact)

**What's happening:** We're building our target list. Not every county is worth pursuing. We need to know where the money is, how to get the data, and how cooperative the treasurer's office will be.

**Key activities:**
- Review county FGU status (County vs. State — State FGU counties have different claim processes)
- Identify foreclosure volume — higher volume = more potential surplus
- Research FOIA submission method for each target county
- Check auction platform for historical sale data
- Assess county cooperation level from prior interactions

**Kelli's action:** Use the County Configuration Database to research and prioritize counties. Focus on High-tier counties first.

**Success metric:** Prioritized list of 10-15 target counties with FOIA method confirmed.

**Timeline:** Ongoing — refresh quarterly.

---

## Stage 2: FOIA Request & Data Acquisition

**What's happening:** We submit formal records requests to county treasurers to obtain the list of properties sold at auction where surplus funds exist.

**Key activities:**
- Draft FOIA request using the appropriate template (see `data/foia-templates.json`)
- Submit via the county's preferred method (portal, email, form, or mail)
- Track submission date — Michigan law requires response within 5 business days
- Follow up on overdue responses using the follow-up template
- Pay any applicable FOIA fees

**Kelli's action:** Generate the FOIA letter from the app, submit it, and update the county's FOIA status in the tracker.

**Success metric:** FOIA response received with complete surplus data within 10 business days.

**Common obstacles:**
- County claims records don't exist → Push back; cite MCL 211.78t
- Fee estimate is excessive → Negotiate scope; request electronic records to reduce cost
- Response is incomplete → File clarification request referencing original FOIA
- County denies request → Cite specific statutory basis; consider FOIA appeal

**Timeline:** 5-15 business days per county.

---

## Stage 3: Data Processing & Prospect Identification

**What's happening:** We've received the surplus records. Now we need to identify which former owners have unclaimed money and how much.

**Key activities:**
- Extract parcel data, former owner names, and surplus amounts from FOIA response
- Separate claimed vs. unclaimed surplus
- Calculate total recoverable amount per county
- Rank prospects by surplus amount (highest value first)
- Cross-reference for any known deadlines or statutes of limitation

**Kelli's action:** Process the data in a spreadsheet. Enter key metrics into the county record (surplus retained, surplus returned, foreclosure volume).

**Success metric:** Clean prospect list ranked by recovery potential.

**Prioritization framework:**
- **Priority 1:** Surplus > $5,000 — worth individual outreach
- **Priority 2:** Surplus $1,000–$5,000 — batch outreach
- **Priority 3:** Surplus < $1,000 — evaluate cost-to-recover vs. fee

**Timeline:** 1-3 days per county dataset.

---

## Stage 4: Owner Outreach (First Customer Touchpoint)

**What's happening:** This is the first time the former owner hears from us. They lost their home — this is a sensitive situation. Our approach must be respectful, clear, and professional.

**Key activities:**
- Skip-trace current addresses for former owners (many have moved)
- Send initial outreach letter explaining:
  - They may be owed surplus funds from the sale of their former property
  - The amount (if we choose to disclose at this stage)
  - How we can help them recover it
  - Our fee structure
  - No obligation to respond
- Log all outreach attempts with dates

**Kelli's action:** Prepare and mail outreach letters. Track in the pipeline per county.

**Tone guidance:**
- Lead with empathy — they lost a home
- Be factual, not salesy — this isn't a marketing pitch
- Clearly state who you are and why you're contacting them
- Include your real contact information (phone, email, address)
- Never pressure — let them come to you

**Success metric:** 15-25% response rate on initial outreach.

**Timeline:** Mail within 1 week of prospect list completion. Allow 2-3 weeks for responses.

---

## Stage 5: Client Engagement

**What's happening:** A former owner has responded and is interested in our help. We now need to establish the professional relationship and gather what we need to file the claim.

**Key activities:**
- Explain the full process in plain language (phone or in person preferred)
- Execute the representation/services agreement
- Collect required identification (government-issued ID)
- Gather proof of prior ownership (deed, tax records, etc.)
- Confirm the surplus amount with county records

**Kelli's action:** Schedule a call or meeting. Walk through the process. Get the agreement signed and docs collected.

**Key principles:**
- Transparency on fees — no surprises
- Set realistic timeline expectations (counties can be slow)
- Document everything — this protects both parties
- If the amount is very small, be honest about whether it's worth pursuing after fees

**Success metric:** Signed agreement + all required docs collected within 2 weeks of initial response.

**Timeline:** 1-2 weeks.

---

## Stage 6: Claim Filing

**What's happening:** We file the formal surplus claim with the county treasurer on behalf of the former owner.

**Key activities:**
- Complete the county-specific claim form (each county may have different requirements)
- Attach all required documentation
- Submit to the treasurer's office
- Get confirmation of receipt
- Set a follow-up reminder based on expected processing time

**Kelli's action:** Prepare and submit the claim package. Update the pipeline status.

**County-specific considerations:**
- Some counties have their own claim forms — check with the treasurer's office
- State FGU counties (Branch, Clinton, Iosco, Livingston, Mecosta) route through the Michigan Department of Treasury in Lansing
- Oakland County has specific post-Rafaeli procedures
- Isabella County — watch for Pung v. Isabella SCOTUS outcome

**Success metric:** Claim accepted and in processing.

**Timeline:** Filing takes 1-2 days. Processing varies: 30-90 days typical, some counties much longer.

---

## Stage 7: Recovery & Distribution

**What's happening:** The claim has been approved and the county is releasing the surplus funds.

**Key activities:**
- Receive payment from county (check or wire)
- Calculate service fee per the agreement
- Distribute the net amount to the client promptly
- Provide a clear final accounting statement
- Request a testimonial (optional — don't push)
- Log the completed recovery for internal reporting

**Kelli's action:** Process the payment, distribute to client, close the file.

**Success metric:** Client receives their funds. We receive our fee. Clean close.

**Timeline:** Distribution within 5 business days of receiving county payment.

---

## Stage 8: Relationship & Referral (Post-Recovery)

**What's happening:** The transaction is complete, but the relationship doesn't have to end. Satisfied clients are the best source of referrals.

**Key activities:**
- Follow up 30 days after distribution — make sure everything is good
- Ask if they know anyone else who lost property to tax foreclosure
- Note any process improvements based on the experience
- Update internal records with outcome data

**Kelli's action:** Quick follow-up call or note. Log any referrals.

**Success metric:** Referral rate > 10%.

---

## Key Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| FOIA requests submitted | 5-10/month | Weekly |
| FOIA response rate (on time) | >80% | Monthly |
| Prospects identified per county | Varies | Per FOIA response |
| Outreach response rate | 15-25% | Monthly |
| Engagement-to-claim conversion | >70% | Monthly |
| Average recovery amount | >$3,000 | Quarterly |
| Average days to recovery | <90 days | Quarterly |
| Client satisfaction | >95% | Per case |
