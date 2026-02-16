#!/bin/bash

# E-Commerce Defense Platform - Setup Script
# This script automates the initial setup process

echo "🛡️  E-Commerce Defense Platform - Setup Script"
echo "================================================"
echo ""

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✓ Python $PYTHON_VERSION found"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✓ Node.js $NODE_VERSION found"
echo ""

# Backend Setup
echo "📦 Setting up backend..."
cd backend

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies (this may take a few minutes)..."
pip install -q -r requirements.txt

echo "✓ Backend dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp ../.env.example .env
    echo "⚠️  IMPORTANT: Edit backend/.env and add your MongoDB URI"
    echo ""
fi

cd ..

# Frontend Setup
echo "📦 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies (this may take a few minutes)..."
npm install --silent

echo "✓ Frontend dependencies installed"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
    echo "✓ Frontend configuration created"
    echo ""
fi

cd ..

# Summary
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Get MongoDB Atlas connection string:"
echo "   - Go to https://cloud.mongodb.com"
echo "   - Create free M0 cluster"
echo "   - Get connection string"
echo ""
echo "2. Edit backend/.env and add your MongoDB URI:"
echo "   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce_defense"
echo ""
echo "3. Seed the database:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python scripts/seed_database.py"
echo ""
echo "4. Start the backend:"
echo "   python app.py"
echo ""
echo "5. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "6. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For detailed instructions, see QUICKSTART.md"
echo ""
echo "🎉 Happy coding!"
