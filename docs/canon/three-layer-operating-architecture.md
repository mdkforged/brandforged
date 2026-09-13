# Brand Forged Three-Layer Operating Architecture

**Status:** Locked  
**Date:** 2026-09-13  
**Decision:** DR-2026-09-13-013  
**Related:** Foundation Milestone 1.0 (DR-012), Brand Input Set (DR-011)

Keep these three layers separate. They serve different purposes.

---

## 1. Brand Input — questions that create the brand

Customer-facing creation intake for the Identity Engine.

Master Brand System source list:

| # | Question / Input | What the system needs |
| --- | --- | --- |
| 1 | Brand Name | The name of the brand |
| 2 | Industry / Niche | What space/business the brand operates in |
| 3 | Audience Description | 1–2 sentences describing who the brand serves |
| 4 | Mood Words | 3–5 keywords for feeling/personality |
| 5 | Color Preference | Optional: warm / cool / neutral / bold |

The source then lists **Logo Style Preference** (wordmark / icon / combo) immediately afterward, even though the workflow calls this the **5-question Brand Input Set**.

**Product resolution (DR-011):** treat the five questions that must be answered for a kit as Brand Name, Industry/Niche, Audience, Mood Words, and Logo Style. Color Preference stays optional and is not counted as one of the five. That keeps Logo in the brief (needed for kit generation) and matches the workflow name while recording the source’s Color-as-#5 wording honestly.

Purpose: Identity Engine takes that brief and produces the locked brand system (palette, typography, logo set, voice, social templates, style guide, Sticker Book) so the user does not have to become a designer.

### Brand Creation Workflow (4.2)

1. Welcome & Brief — 5-question Brand Input Set  
2. Identity Engine Run — full brand kit  
3. Brand Kit Review — approve palette, fonts, logo  
4. Sticker Book Activated — stickers adopt approved tokens  
5. First Template — first branded post  
6. Export & Publish — export/share first asset  
7. Brand Vault Saved — archive in Brand Vault  

This is **Brand Creation Workflow** only — not routing, not governance.

---

## 2. Workflow Routing — where a question/work item belongs

Different layer. Answers: **“Where does this piece of work belong?”**

| If the question/work concerns… | It routes to… |
| --- | --- |
| Mission | Constitution |
| Organization | Strategy Room |
| Products | Master Playbook |
| Engineering | Build Lab |
| Projects | Project Documentation |
| Assets | Brand Vault |

Source name: **Decision Flow** — every decision follows the authority hierarchy.

Success criteria:

- Departments collaborate naturally  
- AI reduces friction  
- Decisions are traceable  
- Knowledge is reusable  
- Contributors know where to go  
- Work moves smoothly from idea to deployment  

---

## 3. Implementation Gate — once the owner is known, build

Governing question: **Which document owns this decision?**

1. Identify the authority  
2. Stay inside its scope  
3. If something genuinely changes, version it  
4. Return to implementation — do not open another governance discussion because building is hard  

Foundation Milestone 1.0: Phase One closed; Phase Two begins.

---

## How the three fit

```
                    BRAND FORGED
                         │
                         ▼
                 WHAT ARE WE DOING?
                         │
          ┌──────────────┴──────────────┐
          │                             │
     CREATE A BRAND?              DO OTHER WORK?
          │                             │
          ▼                             ▼
   BRAND INPUT SET                 ROUTING QUESTIONS
          │                             │
   Name / Industry / Audience           ▼
   Mood / Logo (+ optional Color)  WHICH AUTHORITY OWNS IT?
          │                             │
          ▼                             ▼
   Identity Engine → kit          WORK WITHIN SCOPE
                                      │
                                      ▼
                              VERSION IF NECESSARY
                                      │
                                      ▼
                              BACK TO IMPLEMENTATION
```

### Philosophical difference

| Layer | Asks |
| --- | --- |
| Brand Input | What do you want to create? |
| Workflow Routing | Where does this belong? |
| Implementation Gate | Now that we know where it belongs, what is preventing us from building it? |

Quality of Brand Forged is measured by whether the platform faithfully expresses principles already established — not by more documentation.
