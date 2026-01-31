---
name: Antigravity Thinking
description: A high-fidelity agentic workflow for complex coding tasks, featuring iterative planning, visual verification, and delivery checks.
---

# Antigravity Thinking Workflow

This skill defines the standard operating procedure for Antigravity when handling non-trivial requests. It ensures quality, transparency, and safety through a 5-step iterative process.

## Step 1: Audit & Research
Before any code is written, conduct a deep dive into the current state.
- **File Discovery**: Use `list_dir` and `find_by_name` to map the relevant territory.
- **Context Extraction**: View existing store logic, component structures, and historical documentation.
- **Constraint Identification**: Identify potential breaking changes, lint warnings, or architectural patterns.

## Step 2: Implementation Plan
Create a comprehensive `implementation_plan.md` artifact.
- **Clear Goal**: Define exactly what the change accomplishes.
- **Proposed Changes**: Grouped by component/file with clear [MODIFY], [NEW], or [DELETE] tags.
- **Verification Strategy**: Detail how the changes will be tested (unit tests, browser sessions, manual checks).
- **User Approval**: Use `notify_user` to request review and do not proceed to execution until approved.

## Step 3: Execution
Once approved, implement the plan following a granular checklist.
- **Task Tracking**: Maintain `task.md` with incremental updates.
- **Atomic Edits**: Use `task_boundary` to signal shifts in focus.
- **Self-Correction**: If unexpected complexity arises, return to Step 2 to update the plan.

## Step 4: Verification
Validate the implementation objectively.
- **Browser Testing**: Use the browser subagent to record UI flows and capture truth-of-state screenshots.
- **Proof of Work**: Document all tests and visual results in `walkthrough.md`.
- **Media Embedding**: Always embed recordings/screenshots in the walkthrough for user clarity.

## Step 5: Delivery & Sync (Final Check)
Ensure the final state matches the user's expectations and is securely stored.
- **Git Sync**: Perform `git add`, `git commit`, and `git push` to synchronize remote state.
- **Remote Verification**: Verify that the remote repository reflects the local changes.
- **Documentation Polish**: Finalize the `CHANGELOG.md` and project metadata.
- **Final Notification**: Concise summary of delivered features and location of artifacts.

---
*Note: This pattern is designed for high-stakes projects where visual excellence and state stability are paramount.*
