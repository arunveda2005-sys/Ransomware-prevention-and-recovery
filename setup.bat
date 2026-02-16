@echo off
REM E-Commerce Defense Platform - Setup Script (Windows)
REM This script automates the initial setup process

echo.
echo ========================================
echo E-Commerce Defense Platform - Setup
echo ========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.9+ first.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found
echo.

REM Backend Setup
echo Setting up backend...
cd backend

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies (this may take a few minutes)...
pip install -q -r requirements.txt

echo [OK] Backend dependencies installed
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy ..\.env.example .env
    echo [WARNING] IMPORTANT: Edit backend\.env and add your MongoDB URI
    echo.
)

cd ..

REM Frontend Setup
echo Setting up frontend...
cd frontend

REM Install dependencies
echo Installing Node.js dependencies (this may take a few minutes)...
call npm install --silent

echo [OK] Frontend dependencies installed
echo.

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo Creating .env.local file...
    copy .env.example .env.local
    echo [OK] Frontend configuration created
    echo.
)

cd ..

REM Summary
echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Get MongoDB Atlas connection string:
echo    - Go to https://cloud.mongodb.com
echo    - Create free M0 cluster
echo    - Get connection string
echo.
echo 2. Edit backend\.env and add your MongoDB URI:
echo    MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce_defense
echo.
echo 3. Seed the database:
echo    cd backend
echo    venv\Scripts\activate
echo    python scripts\seed_database.py
echo.
echo 4. Start the backend:
echo    python app.py
echo.
echo 5. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 6. Open http://localhost:3000 in your browser
echo.
echo For detailed instructions, see QUICKSTART.md
echo.
pause
