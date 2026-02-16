# GitHub Deployment Checklist

## 🎯 Essential Files to Push

### ✅ **MUST INCLUDE**

#### Backend Files
- [ ] `backend/app.py` - Main application
- [ ] `backend/run.py` - Application entry point
- [ ] `backend/requirements.txt` - Python dependencies
- [ ] `backend/Procfile` - Render deployment config
- [ ] `backend/config/` - All configuration files
- [ ] `backend/system_a/` - ML threat detector
- [ ] `backend/system_b/` - Canary & data protection
- [ ] `backend/scripts/` - Database seeding & model training
- [ ] `backend/ml_pipeline/` - ML training scripts (without models)

#### Frontend Files
- [ ] `frontend/src/` - All React components
- [ ] `frontend/public/` - Static assets
- [ ] `frontend/index.html` - Entry HTML
- [ ] `frontend/package.json` - NPM dependencies
- [ ] `frontend/package-lock.json` - Dependency lock file
- [ ] `frontend/vite.config.js` - Vite configuration
- [ ] `frontend/vercel.json` - Vercel deployment config
- [ ] `frontend/.env.example` - Environment template

#### Blockchain Files
- [ ] `blockchain/block.py` - Block implementation
- [ ] `blockchain/chain.py` - Blockchain logic
- [ ] `blockchain/__init__.py` - Package init

#### Root Files
- [ ] `.gitignore` - Git exclusions
- [ ] `.env.example` - Environment template (SANITIZED)
- [ ] `README.md` - Project documentation
- [ ] `DEPLOYMENT.md` - Deployment guide
- [ ] `FEATURES.md` - Feature list
- [ ] `TESTING_GUIDE.md` - Testing instructions
- [ ] `PROJECT_SUMMARY.md` - Technical overview
- [ ] `ATTACK_DEMO_GUIDE.md` - Attack simulation guide
- [ ] `render.yaml` - Render config
- [ ] `setup.sh` - Linux setup script
- [ ] `setup.bat` - Windows setup script

---

### ❌ **MUST EXCLUDE** (Already in .gitignore)

#### Security-Sensitive
- [ ] ❌ `backend/.env` - Contains real secrets
- [ ] ❌ `frontend/.env` - Contains API keys
- [ ] ❌ `frontend/.env.local` - Local overrides
- [ ] ❌ Any `.env` files with real credentials

#### Generated/Build Files
- [ ] ❌ `backend/venv/` - Virtual environment
- [ ] ❌ `backend/__pycache__/` - Python cache
- [ ] ❌ `backend/**/*.pyc` - Compiled Python
- [ ] ❌ `frontend/node_modules/` - NPM packages
- [ ] ❌ `frontend/dist/` - Build output
- [ ] ❌ `backend/ml_pipeline/models/*.pkl` - Trained models (large files)

#### IDE/OS Files
- [ ] ❌ `.vscode/` - VSCode settings
- [ ] ❌ `.idea/` - IntelliJ settings
- [ ] ❌ `.DS_Store` - macOS files
- [ ] ❌ `Thumbs.db` - Windows files

---

## 🔧 Pre-Push Actions

### 1. **Fix .env.example File**
Your current `.env.example` contains REAL credentials! Fix it:

```bash
# backend/.env.example
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ENCRYPTION_KEY=your-32-byte-encryption-key-here!!
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-flask-secret-key-change-this
CORS_ORIGINS=http://localhost:3000,https://your-app.vercel.app
BLOCKCHAIN_DIFFICULTY=4
WEBSOCKET_PING_INTERVAL=30
```

### 2. **Create frontend/.env.example**
```bash
# frontend/.env.example
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

### 3. **Verify .gitignore**
Your `.gitignore` is good! It properly excludes:
- ✅ `.env` files
- ✅ `node_modules/`
- ✅ `venv/`
- ✅ `__pycache__/`
- ✅ ML model files

### 4. **Remove Sensitive Data from Code**
Check these files for hardcoded secrets:
```bash
# Search for potential secrets
grep -r "mongodb+srv://" --exclude-dir=node_modules --exclude-dir=venv .
grep -r "API_KEY" --exclude-dir=node_modules --exclude-dir=venv .
```

---

## 📋 GitHub Push Commands

### First-Time Setup
```bash
cd c:\Users\HP\Downloads\Ism\Ecom

# Initialize git (if not already done)
git init

# Add all files (respecting .gitignore)
git add .

# Check what will be committed
git status

# Commit
git commit -m "Initial commit: E-commerce security platform with ML & blockchain"

# Add GitHub remote
git remote add origin https://github.com/arunveda2005-sys/Ransomware-prevention-and-recovery.git

# Push to GitHub
git push -u origin main
```

### If Repository Already Exists
```bash
# Pull first to sync
git pull origin main --allow-unrelated-histories

# Then push
git push origin main
```

---

## 🔒 Security Checklist Before Push

- [ ] Remove real MongoDB URI from all files except `.env` (which is gitignored)
- [ ] Remove real JWT secrets from all files except `.env`
- [ ] Verify `.env.example` has placeholder values only
- [ ] No API keys in frontend code
- [ ] No passwords in commit history
- [ ] `.gitignore` includes `.env`

---

## 📦 Optional: Add ML Models (If Needed)

⚠️ **ML model files (*.pkl) are large and excluded by default**

If you want to include them:

### Option 1: Git LFS (Large File Storage)
```bash
# Install Git LFS
git lfs install

# Track .pkl files
git lfs track "*.pkl"

# Add .gitattributes
git add .gitattributes

# Now add model files
git add backend/ml_pipeline/models/*.pkl
git commit -m "Add ML models via Git LFS"
```

### Option 2: External Storage (Recommended)
- Upload models to Google Drive / Dropbox
- Add download link to README
- Users download and place in `backend/ml_pipeline/models/`

---

## 📝 Update README.md

Add this section to your README:

```markdown
## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arunveda2005-sys/your-repo-name.git
   cd your-repo-name
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   
   # Copy .env.example to .env and update with your credentials
   copy .env.example .env  # Windows
   # cp .env.example .env  # Linux/Mac
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Copy .env.example to .env
   copy .env.example .env  # Windows
   ```

4. **Seed Database**
   ```bash
   cd backend
   python scripts/seed_database.py
   ```

5. **Train ML Models** (Optional)
   ```bash
   python scripts/train_models.py
   ```

6. **Run Application**
   ```bash
   # Terminal 1: Backend
   cd backend
   python run.py
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
```

---

## ✅ Final Verification

Before pushing, verify:

```bash
# Check what will be committed
git status

# Review changes
git diff

# Ensure no .env files are staged
git ls-files | grep "\.env$"
# Should return nothing (or only .env.example)

# Check file sizes
git ls-files | xargs ls -lh | sort -k5 -hr | head -20
# Ensure no huge files (>100MB)
```

---

## 🎉 After Pushing

1. **Add GitHub Repository Description**
   - "AI-powered e-commerce security platform with ML threat detection, blockchain audit trail, and smart canary honeypots"

2. **Add Topics/Tags**
   - `machine-learning`
   - `cybersecurity`
   - `blockchain`
   - `threat-detection`
   - `flask`
   - `react`
   - `mongodb`
   - `websocket`

3. **Update Repository Settings**
   - Enable Issues
   - Enable Discussions (optional)
   - Set branch protection for `main`

4. **Create GitHub Secrets** (for CI/CD later)
   - `MONGODB_URI`
   - `JWT_SECRET_KEY`
   - `SECRET_KEY`

---

## 🚨 Common Mistakes to Avoid

1. ❌ Pushing `.env` files with real credentials
2. ❌ Committing `node_modules/` or `venv/`
3. ❌ Including large ML model files without Git LFS
4. ❌ Hardcoding API URLs in frontend code
5. ❌ Leaving debug mode enabled in production configs

---

## 📞 Need Help?

If you accidentally committed sensitive data:
```bash
# Remove file from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (destructive!)
git push origin --force --all
```

Then **immediately rotate all exposed credentials**!
