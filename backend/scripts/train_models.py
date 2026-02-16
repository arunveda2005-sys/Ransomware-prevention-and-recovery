import os
import sys
import pickle
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier, VotingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier

# Add parent directory to path to find config if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def train_models():
    """
    Train and save initial models for the Agentic Threat Detector.
    Since this is a demo environment, we train on synthetic 'normal' data
    so that deviations (attacks) are detected as anomalies.
    """
    print("🚀 Starting model training pipeline...")
    
    # directories
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, 'ml_pipeline', 'models')
    
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"📁 Created directory: {models_dir}")

    # Generate synthetic training data (Normal Traffic Pattern)
    # Features: [request_rate, response_rate, data_sent, ... 18 features total]
    # We simulate 1000 'normal' user sessions
    print("📊 Generating synthetic training data...")
    X_train = np.random.normal(loc=0.5, scale=0.1, size=(1000, 18))
    
    # Generate some 'attack' data for supervised models (outliers)
    X_attack = np.random.normal(loc=2.0, scale=0.5, size=(100, 18))
    
    X_combined = np.vstack([X_train, X_attack])
    y_combined = np.hstack([np.zeros(1000), np.ones(100)]) # 0=Normal, 1=Attack

    # 1. Isolation Forest (Unsupervised)
    print("🤖 Training Isolation Forest...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    iso_forest.fit(X_train) # Train only on normal data
    
    # 2. XGBoost (Supervised)
    print("🔥 Training XGBoost...")
    xgb = XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    xgb.fit(X_combined, y_combined)
    
    # 3. Random Forest (Supervised)
    print("🌲 Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_combined, y_combined)
    
    # 4. Voting Ensemble
    print("🗳️ Training Voting Ensemble...")
    voting = VotingClassifier(
        estimators=[('xgb', xgb), ('rf', rf)],
        voting='soft'
    )
    voting.fit(X_combined, y_combined)
    
    # 5. Stacking Ensemble
    print("📚 Training Stacking Ensemble...")
    estimators = [('rf', rf), ('xgb', xgb)]
    stacking = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression()
    )
    stacking.fit(X_combined, y_combined)

    # Save all models
    models = {
        'isolation_forest.pkl': iso_forest,
        'xgboost.pkl': xgb,
        'random_forest.pkl': rf,
        'voting_ensemble.pkl': voting,
        'stacking_ensemble.pkl': stacking
    }
    
    print("\n💾 Saving models...")
    for filename, model in models.items():
        filepath = os.path.join(models_dir, filename)
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
        print(f"  ✓ Saved {filename}")

    print("\n✅ All models trained and saved successfully!")

if __name__ == '__main__':
    train_models()
