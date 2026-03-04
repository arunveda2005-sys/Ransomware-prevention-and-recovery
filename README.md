# 🛡️ Agentic E-Commerce Security System

A sophisticated, AI-driven security framework designed to protect e-commerce platforms from advanced web attacks. This system combines **Agentic AI**, **Machine Learning**, and **Deception Technology** to detect, block, and log malicious activities in real-time.

---

## 🚀 Key Features

### **System A: Agentic Threat Detection**
*   **Real-time Analysis:** Monitors HTTP traffic patterns using an ensemble of ML models (Isolation Forest, XGBoost, Random Forest, Voting Classifier).
*   **Behavioral Profiling:** detailed tracking of user sessions, request rates, endpoint diversity, and more.
*   **Autonomous Response:** Automatically blocks or throttles suspicious IPs based on calculated risk scores.
*   **Features:** Analyzes 29+ HTTP-specific features including request rate, repeat ratio, sensitive endpoint access, and browser fingerprinting.

### **System B: Data Protection & Deception**
*   **Honeytokens:** Injects fake data (users, credentials) into database responses to entrap attackers.
*   **Smart Canaries:** Deploys tracked files and endpoints that, when accessed, trigger immediate alerts.
*   **Breach Cost Calculation:** Estimates the potential financial impact of a data breach in real-time.
*   **Data Masking:** Automatically redacts sensitive PII (Personally Identifiable Information) in logs and responses.

### **🔒 Blockchain Audit Trail**
*   **Immutable Logging:** All security events and decisions are recorded on a local blockchain to prevent tampering.
*   **Transparency:** Provides a verifiable history of all detected threats and system actions.

### **💻 Interactive Frontend**
*   **Admin Dashboard:** Visualizes live threats, risk scores, blockchain logs, and system health.
*   **Attacker Console:** A built-in tool to simulate various attacks (Scraping, SQL Injection, etc.) for testing system defenses.

---

## 🛠️ Tech Stack

*   **Backend:** Python (Flask), Socket.IO
*   **Frontend:** React (Vite), TailwindCSS, Recharts
*   **Machine Learning:** Scikit-learn, XGBoost, Pandas, NumPy
*   **Database:** MongoDB
*   **Security:** JWT, BCrypt, Custom Agentic Middleware

---

## 📂 Project Structure

```
├── backend/
│   ├── system_a/           # Agentic Threat Detection Logic
│   │   ├── agentic_detector.py  # Main ML-driven detector
│   │   └── blockchain_logger.py # Blockchain integration
│   ├── system_b/           # Data Protection & Deception
│   │   ├── honeytoken_generator.py # Generates fake data
│   │   └── smart_canaries.py       # Manages trap files
│   ├── blockchain/         # Blockchain Implementation
│   ├── ml_pipeline/        # Backend ML Models storage
│   └── app.py              # Main Flask Application
│
├── frontend/               # React Application
│   ├── src/components/Admin    # Administrative Dashboard
│   └── src/components/Attacker # Attack Simulation Console
│
├── ml_pipeline/            # ML Training & Data Generation
│   ├── generate_synthetic_data.py # Creates training dataset
│   ├── train_http_models.py       # Trains ML models
│   └── synthetic_ecommerce_security_data.csv
│
├── train.bat               # One-click model retraining
└── generate_and_train.bat  # New data generation + training
```

---

## ⚡ Getting Started

### 1. Prerequisites
*   Python 3.8+
*   Node.js 16+
*   MongoDB (running locally or cloud URI)

### 2. Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Environment Setup
Create a `.env` file in `backend/` and `frontend/` (see `.env.example`).

**Backend (`backend/.env`):**
```ini
SECRET_KEY=your_secret_key
MONGO_URI=mongodb://localhost:27017/ecommerce_defense
```

**Frontend (`frontend/.env`):**
```ini
VITE_API_URL=http://localhost:5000
```

---

## 🏃‍♂️ Running the Application

### 1. Train ML Models (First Run)
Before starting the backend, ensure models are trained:
```bash
# Windows
train.bat
```

### 2. Start Backend
```bash
cd backend
python run.py
```
*Server runs on `http://localhost:5000`*

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
*App runs on `http://localhost:5173`*

---

## 🧠 Machine Learning Pipeline

The system uses a custom ML pipeline trained on synthetic e-commerce HTTP traffic.

*   **Retrain Models:** Run `train.bat` in the root directory.
*   **Generate New Data:** Run `generate_and_train.bat` to create fresh scenarios and retrain.

**Supported Detection Models:**
*   Isolation Forest (Anomaly Detection)
*   XGBoost (Gradient Boosting)
*   Random Forest
*   Voting Ensemble (Combines all models)

---

## 🧪 Testing the System

1.  Open the **Admin Dashboard** (`/admin`) to view live stats.
2.  Open the **Attacker Console** (`/attacker`) in a separate window.
3.  Simulate attacks:
    *   **Rapid Scraping:** Click "Rapid Request" repeatedly.
    *   **Data Exfiltration:** Attempt to access sensitive endpoints.
4.  Observe the **Live Threat Monitor** in the Admin Dashboard blocking the attacks in real-time.

---

## 📝 License
This project is for educational and research purposes.
