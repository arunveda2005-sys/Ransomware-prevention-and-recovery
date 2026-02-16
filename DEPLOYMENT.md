# E-Commerce Defense Platform - Deployment Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB Atlas account (free tier)

### 1. MongoDB Atlas Setup

1. Create account at https://cloud.mongodb.com
2. Create a free M0 cluster (512MB)
3. Create database user with password
4. Whitelist all IPs: `0.0.0.0/0` (for development)
5. Get connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce_defense
   ```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env

# Edit .env and add your MongoDB URI
# MONGODB_URI=mongodb+srv://...

# Seed database
python scripts/seed_database.py

# Run backend
python app.py
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Run frontend
npm run dev
```

Frontend will run on http://localhost:3000

### 4. Test the Application

**Login Credentials:**
- Admin: `admin@ecommerce.com` / `admin123`
- User: `user@example.com` / `user123`
- Attacker: `attacker@example.com` / `attacker123`

**Test Flow:**
1. Login as admin
2. Go to Admin Dashboard
3. Deploy 50 canaries
4. Go to Attack Monitor (real-time view)
5. Open new tab, login as user
6. Browse products, add to cart
7. Watch Attack Monitor for real-time threat detection
8. As admin, click "Export Users" to trigger canary alert

## 🌐 Production Deployment

### Deploy Backend to Render

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render account** at https://render.com

3. **Create Web Service**
   - Connect GitHub repository
   - Select "Python" environment
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`

4. **Add Environment Variables** in Render dashboard:
   ```
   MONGODB_URI=<your-mongodb-atlas-uri>
   SECRET_KEY=<generate-random-string>
   ENCRYPTION_KEY=<generate-32-char-string>
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

5. **Deploy** - Render will automatically deploy

6. **Note your backend URL**: `https://your-app.onrender.com`

### Deploy Frontend to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   ```

3. **Add Environment Variables** in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_BACKEND_URL=https://your-backend.onrender.com
   ```

4. **Redeploy** after adding env vars:
   ```bash
   vercel --prod
   ```

5. **Update CORS** in Render backend env:
   ```
   CORS_ORIGINS=https://your-frontend.vercel.app
   ```

## 🤖 ML Models (Optional - Enhanced Detection)

The system works with fallback heuristics, but for full ML capabilities:

### Download UNSW-NB15 Dataset

```bash
cd ml_pipeline

# Download dataset (requires ~2GB space)
python datasets/download_unsw.py

# Prepare features
python datasets/prepare_unsw.py

# Train models (takes 10-30 minutes)
python train_ensemble.py
```

Models will be saved to `ml_pipeline/models/` and automatically loaded by backend.

## 📊 Features Overview

### System A: Agentic Behavioral Defense
- ✅ Real-time request monitoring
- ✅ Ensemble ML models (when trained)
- ✅ Autonomous threat assessment
- ✅ Adaptive response selection
- ✅ Blockchain audit logging
- ✅ WebSocket live updates

### System B: Data Resilience
- ✅ Smart canary generation
- ✅ ML-based honeypot records
- ✅ Breach detection
- ✅ Impact calculation
- ✅ Data encryption
- ✅ Differential privacy

### Admin Dashboard
- ✅ Real-time attack visualization
- ✅ Live threat feed
- ✅ Risk score trending
- ✅ Action distribution charts
- ✅ Blockchain viewer
- ✅ Canary deployment
- ✅ Breach alerts

## 🔧 Troubleshooting

### Backend won't start
- Check MongoDB URI is correct
- Ensure all environment variables are set
- Check Python version (3.9+)

### Frontend can't connect to backend
- Verify VITE_API_URL in .env.local
- Check CORS_ORIGINS in backend .env
- Ensure backend is running

### WebSocket not connecting
- Check VITE_BACKEND_URL (no /api suffix)
- Verify backend supports WebSocket (eventlet installed)
- Check browser console for errors

### No threats detected
- System needs 2+ requests per session to analyze
- Browse products, add to cart to generate activity
- Check Attack Monitor page is open

## 📝 Architecture Notes

### Request Flow
1. Frontend sends request with Session-ID header
2. Backend middleware logs request
3. System A analyzes behavioral patterns
4. Threat detector makes autonomous decision
5. High-risk events logged to blockchain
6. Real-time updates sent via WebSocket
7. Admin dashboard displays live data

### Blockchain
- Difficulty: 4 (adjustable)
- Auto-mining: Every 60 seconds or 10 events
- Immutable audit trail
- Cryptographic verification

### Canaries
- ML-generated realistic records
- Monitoring email domains
- Instant breach detection
- Critical alerts via WebSocket

## 🎯 Testing Scenarios

### Test 1: Normal User Flow
1. Login as user
2. Browse products
3. Add items to cart
4. Checkout
5. Check Attack Monitor - should show low risk

### Test 2: Rapid Requests (Simulated Attack)
1. Open browser console
2. Run rapid API calls
3. Watch Attack Monitor for increased risk scores
4. System should throttle/block

### Test 3: Canary Breach Detection
1. Login as admin
2. Deploy canaries
3. Click "Export Users"
4. Canary alert should trigger
5. Blockchain logs the event

## 📚 Additional Resources

- MongoDB Atlas: https://cloud.mongodb.com
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- UNSW-NB15 Dataset: https://research.unsw.edu.au/projects/unsw-nb15-dataset

## 🆘 Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs in Render dashboard
3. Verify all environment variables
4. Ensure MongoDB Atlas is accessible

## 🔐 Security Notes

**For Production:**
- Use strong SECRET_KEY and ENCRYPTION_KEY
- Restrict MongoDB IP whitelist
- Enable MongoDB authentication
- Use HTTPS only
- Set proper CORS origins
- Rotate keys regularly
- Monitor blockchain integrity
- Review canary alerts immediately
