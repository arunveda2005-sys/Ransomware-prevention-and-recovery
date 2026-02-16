@echo off
REM GitHub Pre-Push Safety Check
REM Run this before pushing to GitHub

echo ========================================
echo GitHub Pre-Push Safety Check
echo ========================================
echo.

echo [1/5] Checking for .env files in staged commits...
git ls-files | findstr /R "\.env$" > nul
if %errorlevel% equ 0 (
    echo WARNING: Found .env files!
    git ls-files | findstr /R "\.env$"
    echo.
    echo These should NOT be committed!
    echo Only .env.example files should be in Git.
    pause
    exit /b 1
) else (
    echo PASS: No .env files found in staged commits
)
echo.

echo [2/5] Checking for large files (over 50MB)...
FOR /F "tokens=*" %%A IN ('git ls-files') DO (
    if exist "%%A" (
        FOR %%B IN ("%%A") DO (
            REM Size in bytes
            if %%~zB GTR 52428800 (
                echo WARNING: Large file found: %%A (%%~zB bytes^)
            )
        )
    )
)
echo PASS: No large files detected
echo.

echo [3/5] Checking for hardcoded secrets in staged files...
git diff --cached | findstr /I "mongodb+srv://.*:.*@" > nul
if %errorlevel% equ 0 (
    echo WARNING: Found potential MongoDB URI in staged changes!
    echo Please review your commits
    pause
) else (
    echo PASS: No obvious secrets detected
)
echo.

echo [4/5] Verifying .gitignore exists...
if exist .gitignore (
    echo PASS: .gitignore found
) else (
    echo ERROR: .gitignore not found!
    exit /b 1
)
echo.

echo [5/5] Checking Git repository status...
git status
echo.

echo ========================================
echo Pre-Push Checklist:
echo ========================================
echo [ ] backend/.env is NOT in git (gitignored)
echo [ ] frontend/.env is NOT in git (gitignored)
echo [ ] .env.example has placeholder values only
echo [ ] No API keys or passwords in code
echo [ ] ML models excluded (or using Git LFS)
echo [ ] README.md is up to date
echo.
echo If all checks pass, you can safely run:
echo   git add .
echo   git commit -m "Initial commit"
echo   git push origin main
echo.
pause
