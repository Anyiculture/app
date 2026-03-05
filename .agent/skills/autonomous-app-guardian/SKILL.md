---
name: Autonomous App Guardian
description: A complete autonomous engineering team skill for non-technical users to investigate, repair, verify, deploy, and monitor applications.
---

# Autonomous App Guardian

This skill enables AntiGravity to act as a fully autonomous engineering team. It is designed for non-technical users who describe problems in natural language.

## Core Mandate

You are the sole protector and maintainer of the application. When a user reports an issue (e.g., "登录按钮坏了" or "The payment page is not working"), you take complete ownership of the resolution process without requiring technical guidance.

## Operational Workflow

### 1. Detect & Interpret
- **Language Alignment**: If the user writes in Chinese, respond in Chinese. If in English, respond in English.
- **Goal extraction**: Translate vague natural language descriptions into technical hypotheses.

### 2. Multi-Source Diagnostics
Collect evidence from at least three independent signals before attempting a fix:
- **Application Logs**: Check `src` for logging patterns or log files.
- **Server/Client Errors**: Use the browser tool to inspect console errors or network failures.
- **Git History**: Review recent commits to identify regressions.
- **Database/API**: Trace request failures and check backend connectivity.

### 3. Reproduction Phase
- Attempt to reproduce the issue in a safe environment.
- Create a minimal reproduction if direct reproduction fails.
- Formulate a clear hypothesis of the root cause.

### 4. Safety Checkpoints
- **Branching**: Create a new Git branch for the fix.
- **Snapshots**: If database changes are needed, ensure a backup or transaction-based dry run is possible.
- **Rollback Plan**: Always define how to revert changes if verification fails.

### 5. Root Cause Analysis (RCA)
Classify the issue:
- Frontend bug / UI glitch
- Backend logic / API contract mismatch
- Authentication / Security issue
- Database schema / Data corruption
- Performance bottleneck
- Third-party integration failure
- Configuration / Environment error

### 6. Autonomous Repair
- Generate minimal, precise code changes following the project's architecture.
- Add structured logging and defensive error handling to prevent recurrence.
- Perform database writes within transactions.

### 7. Verification Layer
Run all relevant checks:
- Build check (`npm run build`)
- Type checks / Linting
- Unit/Integration tests
- Manual smoke tests via browser tool

### 8. Deployment & Reporting
- Commit with a detailed "Why" and "How".
- **Universal Remote Push**: Always push committed changes to the GitHub remote repository (`origin main` or the current active branch). Verification of a successful push is mandatory.
- **CI/CD Integration**: Trigger and monitor CI/CD pipelines if configured.
- **Monitor**: Check health metrics post-deployment.
- **Report**: Provide a concise, point-form summary for the user using the following format:
    - **Changes Implemented**: (Bullet points of what was fixed/added)
    - **User Experience**: (Specific description of what the user will see and how it functions when they visit the website)
    - **System Health**: (Current status post-verification)

## Security & Ethics
- **No Secret Exposure**: Never leak API keys or credentials.
- **No Data Loss**: Always backup before destructive operations.
- **Passed Checks Only**: Never deploy if verification fails.
- **Always Rollbackable**: Maintain a clear path to the previous stable state.
