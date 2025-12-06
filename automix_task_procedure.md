# Automix Project — Task Procedure Guide

## Branching Model
The project uses a structured branching strategy to maintain code quality and control deployments.

### Main Branch
- `main` is a **protected branch**.
- Only users with **admin roles** can target or merge into it.
- No one should create branches directly from `main`.

### Develop Branch
- All new branches must be created from `develop`.
- This branch contains the latest integrated features under development.

---

## Creating a New Branch
Branches must follow the defined naming convention:
```
feat/<student number>/short-description
fix/<student number>/short-description
```
**Examples:**
- `feat/64202/add-user-permissions`
- `fix/61404/fix-login-page`

### Git Commands
From the project root:
```bash
git checkout develop
git pull origin develop

# Create your branch
git checkout -b feat/<student number>/<short-description>
```

After implementing the changes:
```bash
# Stage changes
git add .

# Commit
# (Husky will run linting before the commit is finalized)
git commit -m "feat(<student number>): short description"

# Push the branch
git push -u origin feat/<student number>/<short-description>
```

---

## Husky & Pre‑Commit Linting
Husky is installed in the project to ensure code quality.

- Before every commit, **Husky automatically runs lint validation**.
- If the linting process fails, the commit is blocked until the issues are fixed.
- This ensures consistent code style and prevents broken code from entering the repository.

---

## Creating a Merge Request
Once work is complete:
1. Push your branch.
2. Open a **Merge Request targeting `develop`**.
3. Add reviewers.
4. Ensure pipeline and lint rules pass.

Merges into `main` are restricted to administrators.

---

## Pull Request Title and Description Patterns

### Feature PR
**Title:** `[<student-number>] - Feat short description`

eg: [64202] - Feat add user permissions

**Description (Copy and paste to use md):**
```md
### What's New:
- New feature a
- New feature b
- New feature c
```

### Fix PR
**Title:** `[<student-number>] - Fix short description`

eg: [64202] - Fix resolve login validation issue

**Description:**
```md
### What's Fixed:
- Fixed issue a
- Fixed issue b
- Fixed issue c

### Root Cause:
- Description of the root cause (if known)
```


This workflow ensures clean, organized, and safe development within the Automix project.

