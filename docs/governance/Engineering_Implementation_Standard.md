# Engineering Implementation Standard

This document defines the repository-level implementation rules for Brand Forged.

## Scope

This standard applies to all implementation work in the Brand Forged repository.

## Principle

Follow the Brand Forged authoritative governance documents and repository standards before making implementation decisions. If there is any conflict between this standard and the Brand Forged Constitution, Knowledge System, Repository Audit, or Master Playbook, stop and request clarification.

## Rules

1. Before proposing any milestone, inspect the current working tree.
   - Identify modified and untracked files.
   - Classify them by milestone.
   - Explain whether they should remain untouched.
   - Do not include them in the new milestone unless explicitly approved.

2. One approved milestone per commit.

3. One logical purpose per commit.

4. No unrelated files in a commit.

5. No architectural decisions during implementation without direction.

6. Before every commit:
   - Run `git status`.
   - Run `git diff --cached --stat`.
   - Display the complete terminal output.
   - List every staged file.
   - Explain why each staged file belongs to the approved milestone.
   - Confirm that no unrelated files are staged.
   - Wait for approval before committing.

7. After every successful commit, re-run `git status` and treat the resulting working tree as the new baseline before proposing the next milestone.

8. Every file in a commit must be traceable to:
   - an approved milestone,
   - an approved architectural decision, or
   - an approved bug fix.

## Repository policy

- The implementation engineer must retrieve authoritative documentation before making implementation decisions whenever it is available.
- The implementation engineer must never recreate or reinterpret the authoritative documents from memory.
- The implementation engineer must stop and ask for direction whenever an implementation requires an architectural decision.
