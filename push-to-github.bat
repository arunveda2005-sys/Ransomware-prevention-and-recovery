@echo off
REM Complete GitHub Setup Script for E-Commerce Security Platform
REM This script helps you safely push to GitHub

echo ============================================================
echo E-Commerce Security Platform - GitHub Setup
echo ============================================================
echo.

REM Step 1: Check if Git is installed
echo [Step 1/8] Checking Git installation...
git --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/downloads
    pause
    exit /b 1
)
echo PASS: Git is installed
echo.

REM Step 2: Initialize Git repository
echo [Step 2/8] Initializing Git repository...
if not exist ".git" (
    git init
    echo Git repository initialized
) else (
    echo Git repository already exists
)
echo.

REM Step 3: Check .gitignore
echo [Step 3/8] Verifying .gitignore...
if exist ".gitignore" (
    echo PASS: .gitignore found
) else (
    echo ERROR: .gitignore not found!
    pause
    exit /b 1
)
echo.

REM Step 4: Safety check - ensure .env files are gitignored
echo [Step 4/8] Safety check - verifying .env files are ignored...
if exist "backend\.env" (
    git check-ignore backend\.env > nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: backend\.env is NOT being ignored by git!
        echo This will expose your secrets!
        pause
        exit /b 1
    ) else (
        echo PASS: backend\.env is properly ignored
    )
)

if exist "frontend\.env" (
    git check-ignore frontend\.env > nul 2>&1
    if %errorlevel% neq 0 (
        echo ERROR: frontend\.env is NOT being ignored by git!
        pause
        exit /b 1
    ) else (
        echo PASS: frontend\.env is properly ignored
    )
)
echo.

REM Step 5: Add all files
echo [Step 5/8] Adding files to Git...
echo This will add all files except those in .gitignore
pause
git add .
echo Files added
echo.

REM Step 6: Show what will be committed
echo [Step 6/8] Files to be committed:
git status
echo.
echo Please review the list above carefully!
echo Make sure NO .env files are listed!
pause
echo.

REM Step 7: Commit
echo [Step 7/8] Creating commit...
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Initial commit: E-commerce security platform with ML and blockchain

git commit -m "%commit_message%"
echo.

REM Step 8: Add remote and push
echo [Step 8/8] Setting up GitHub remote...
echo.
echo Your GitHub repository URL is:
echo https://github.com/arunveda2005-sys/Ransomware-prevention-and-recovery
echo.
set /p confirm="Is this correct? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo.
    set /p repo_url="Enter your GitHub repository URL: "
) else (
    set repo_url=https://github.com/arunveda2005-sys/Ransomware-prevention-and-recovery.git
)

echo.
echo Adding remote origin...
git remote remove origin > nul 2>&1
git remote add origin %repo_url%
echo.

echo ============================================================
echo Ready to Push!
echo ============================================================
echo.
echo Final checklist:
echo [ ] backend/.env is NOT in the commit
echo [ ] frontend/.env is NOT in the commit
echo [ ] .env.example has placeholder values only
echo [ ] No real API keys or passwords in the code
echo.
set /p push_confirm="Push to GitHub now? (Y/N): "
if /i "%push_confirm%"=="Y" (
    echo.
    echo Pushing to GitHub...
    git branch -M main
    git push -u origin main
    echo.
    echo ============================================================
    echo SUCCESS!
    echo ============================================================
    echo.
    echo Your code is now on GitHub!
    echo.
    echo Next steps:
    echo 1. Go to: https://github.com/arunveda2005-sys/Ransomware-prevention-and-recovery
    echo 2. Add repository description
    echo 3. Add topics/tags
    echo 4. Review the README.md
    echo.
) else (
    echo.
    echo Push cancelled. When you're ready, run:
    echo   git branch -M main
    echo   git push -u origin main
)
echo.
pause
