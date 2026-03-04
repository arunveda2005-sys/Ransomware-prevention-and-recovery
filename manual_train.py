
import pandas as pd
import numpy as np
import os
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest, VotingClassifier
from sklearn.linear_model import LogisticRegression
import xgboost as xgb

# ==========================================
# CONFIGURATION
# ==========================================
DATA_FILE = 'ml_pipeline/synthetic_ecommerce_security_data.csv'
MODELS_DIR = 'backend/ml_pipeline/models'

def train():
    print("="*60)
    print("  MANUAL TRAINING START")
    print("="*60)

    # 1. Load Data
    if not os.path.exists(DATA_FILE):
        print(f"❌ Error: Dataset not found at {DATA_FILE}")
        return

    print(f"\n📂 Loading data from {DATA_FILE}...")
    df = pd.read_csv(DATA_FILE)
    print(f"   Nodes: {len(df)}")
    
    # Feature columns (Drop label)
    X = df.drop('label', axis=1)
    # Binary Label: 1 = Attack, 0 = Normal
    y = (df['label'] != 'NORMAL').astype(int)
    
    feature_names = list(X.columns)
    print(f"   Features: {len(feature_names)}")

    # 2. Split Data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 3. Scale Data (Important!)
    print("\n⚖️  Scaling features...")
    scaler = StandardScaler()
    # Fit on DataFrame to keep feature names
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train Models
    print("\n🧠 Training models...")
    models = {}

    # Isolation Forest
    print("   - Isolation Forest...")
    iso = IsolationForest(contamination=0.3, random_state=42)
    iso.fit(X_train_scaled)
    models['isolation_forest'] = iso

    # XGBoost
    print("   - XGBoost...")
    xgb_model = xgb.XGBClassifier(eval_metric='logloss')
    xgb_model.fit(X_train_scaled, y_train)
    models['xgboost'] = xgb_model

    # Random Forest
    print("   - Random Forest...")
    rf = RandomForestClassifier(n_estimators=100)
    rf.fit(X_train_scaled, y_train)
    models['random_forest'] = rf

    # Logistic Regression
    print("   - Logistic Regression...")
    lr = LogisticRegression(max_iter=1000)
    lr.fit(X_train_scaled, y_train)
    models['logistic_regression'] = lr

    # Voting Ensemble
    print("   - Voting Ensemble...")
    voting = VotingClassifier(
        estimators=[('xgb', xgb_model), ('rf', rf)],
        voting='soft'
    )
    voting.fit(X_train_scaled, y_train)
    models['voting_ensemble'] = voting

    # 5. Save Models
    print(f"\n💾 Saving to {MODELS_DIR}...")
    os.makedirs(MODELS_DIR, exist_ok=True)

    for name, model in models.items():
        with open(os.path.join(MODELS_DIR, f'{name}.pkl'), 'wb') as f:
            pickle.dump(model, f)
        print(f"   ✓ Saved {name}.pkl")

    # Save Scaler & Feature Names
    with open(os.path.join(MODELS_DIR, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    print("   ✓ Saved scaler.pkl")

    with open(os.path.join(MODELS_DIR, 'feature_names.pkl'), 'wb') as f:
        pickle.dump(feature_names, f)
    print("   ✓ Saved feature_names.pkl")

    print("\n✅ DONE! Restart backend to load new models.")

if __name__ == "__main__":
    train()
