# Brand Forged Implementation Standard v1.0

## Purpose

This document defines the engineering implementation process for the Brand Forged repository.

It governs **how** implementation work is performed. It does not define **what** the product is or **why** architectural decisions are made. Those responsibilities belong to the Constitution, Core Knowledge Pack, Master Playbook, and approved architectural documents.

---

## Scope

This standard applies to all implementation work within the Brand Forged repository and any future repository that formally adopts this standard.

---

## Governing Principle

Follow the Brand Forged authoritative governance documents before making implementation decisions.

If there is any conflict between this standard and the Brand Forged Constitution, Knowledge System, Repository Audit, Master Playbook, or other authoritative documentation, implementation pauses until clarification is obtained.

Engineering documentation supports the authoritative governance documents; it never replaces them.

---

## Implementation Philosophy

This standard exists to support the constitutional design principle:

> **Governance exists to enable execution, not to delay it.**

Its purpose is to make implementation:

- more disciplined,
- more predictable,
- easier to review,
- easier to maintain,
- easier to sustain as Brand Forged grows.

Implementation serves the organization by faithfully applying approved decisions while preserving a clean, understandable engineering history.

---

## Rules

### 1. Inspect Before Implementing

Before proposing any milestone:

- Inspect the current working tree.
- Identify modified files.
- Identify staged files.
- Identify untracked files.
- Classify each item by milestone.
- Explain whether existing work should remain untouched.
- Do not include existing work in a new milestone unless explicitly approved.

---

### 2. One Approved Milestone Per Commit

Each commit represents one approved implementation milestone.

---

### 3. One Logical Purpose Per Commit

Every commit should communicate one clearly defined objective.

---

### 4. No Unrelated Files

Do not include unrelated files in the same commit.

---

### 5. No Architectural Decisions During Implementation

Implementation follows approved architecture.

If architectural direction is required, stop and request guidance.

---

### 6. New Governance Requires Its Own Milestone

If implementing a requested improvement would itself create a new governing artifact, stop and request a dedicated governance milestone before proceeding.

---

### 7. Commit Verification

Before every commit:

- Run:

```
git status
```

- Run:

```
git diff --cached --stat
```

- Display the complete terminal output.
- List every staged file.
- Explain why each staged file belongs to the approved milestone.
- Confirm that no unrelated files are staged.
- Wait for approval before committing.

---

### 8. Establish the New Baseline

After every successful commit:

- Run:

```
git status
```

- Treat the resulting working tree as the new implementation baseline.
- Only then propose the next milestone.

---

### 9. Traceability

Every file in every commit must be traceable to:

- an approved milestone,
- an approved architectural decision,
- or an approved bug fix.

---

## Repository Policy

- Retrieve authoritative documentation before making implementation decisions whenever it exists.
- Never recreate or reinterpret authoritative documentation from memory.
- Respect document authority.
- Stop and request direction whenever implementation requires an architectural decision.

---

## Success Criteria

This standard is successful when:

- Every commit has a single logical purpose.
- Repository history clearly reflects project evolution.
- Contributors can understand why every change exists.
- Implementation faithfully follows approved governance.
- Architectural decisions remain intentional.
- Governance accelerates implementation instead of slowing it.

---

## Adoption

**Status:** Adopted

**Version:** 1.0

**Authority:** Brand Forged Engineering Standard

**Constitutional Alignment:**

> **Governance exists to enable execution, not to delay it.**


