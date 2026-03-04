"""
Train ML Models on HTTP Security Features
Uses synthetic e-commerce security dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest, VotingClassifier
from sklearn.linear_model import LogisticRegression
import xgboost as xgb
import pickle
import os

def load_and_prepare_data(filepath):
    """Load and prepare the dataset"""
    print(f"📂 Loading data from {filepath}...")
    df = pd.read_csv(filepath)
    
    print(f"✅ Loaded {len(df)} samples")
    print(f"📊 Label distribution:\n{df['label'].value_counts()}\n")
    
    # Separate features and labels
    X = df.drop('label', axis=1)
    y = df['label']
    
    # Binary classification: NORMAL vs ATTACK
    y_binary = (y != 'NORMAL').astype(int)
    
    print(f"🎯 Features: {list(X.columns)}\n")
    print(f"Feature count: {len(X.columns)}")
    
    return X, y, y_binary


def train_models(X_train, X_test, y_train, y_test):
    """Train ensemble of ML models"""
    print("\n🔧 Training ML models...")
    
    models = {}
    
    # 1. Isolation Forest (Anomaly Detection)
    print("  Training Isolation Forest...")
    iso_forest = IsolationForest(
        contamination=0.3,  # 30% are attacks
        random_state=42,
        n_estimators=100
    )
    iso_forest.fit(X_train)
    models['isolation_forest'] = iso_forest
    
    # Evaluate
    iso_pred = iso_forest.predict(X_test)
    iso_pred_binary = (iso_pred == -1).astype(int)  # -1 = anomaly
    iso_acc = (iso_pred_binary == y_test).mean()
    print(f"    ✅ Isolation Forest Accuracy: {iso_acc:.2%}")
    
    # 2. XGBoost
    print("  Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train)
    models['xgboost'] = xgb_model
    
    xgb_acc = xgb_model.score(X_test, y_test)
    print(f"    ✅ XGBoost Accuracy: {xgb_acc:.2%}")
    
    # 3. Random Forest
    print("  Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    models['random_forest'] = rf_model
    
    rf_acc = rf_model.score(X_test, y_test)
    print(f"    ✅ Random Forest Accuracy: {rf_acc:.2%}")
    
    # 4. Voting Ensemble
    print("  Training Voting Ensemble...")
    voting = VotingClassifier(
        estimators=[
            ('xgb', xgb_model),
            ('rf', rf_model)
        ],
        voting='soft'
    )
    voting.fit(X_train, y_train)
    models['voting_ensemble'] = voting
    
    voting_acc = voting.score(X_test, y_test)
    print(f"    ✅ Voting Ensemble Accuracy: {voting_acc:.2%}")
    
    # 5. Logistic Regression (for stacking)
    print("  Training Logistic Regression...")
    lr_model = LogisticRegression(random_state=42, max_iter=1000)
    lr_model.fit(X_train, y_train)
    models['logistic_regression'] = lr_model
    
    lr_acc = lr_model.score(X_test, y_test)
    print(f"    ✅ Logistic Regression Accuracy: {lr_acc:.2%}")
    
    return models


def save_models(models, scaler, feature_names, output_dir=None):
    """Save trained models"""
    if output_dir is None:
        # Save to backend/ml_pipeline/models relative to project root
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, 'backend', 'ml_pipeline', 'models')
        
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\n💾 Saving models to {output_dir}/...")
    
    # Save each model
    for name, model in models.items():
        filepath = os.path.join(output_dir, f'{name}.pkl')
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
        print(f"  ✅ Saved {name}.pkl")
    
    # Save scaler
    scaler_path = os.path.join(output_dir, 'scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"  ✅ Saved scaler.pkl")
    
    # Save feature names
    features_path = os.path.join(output_dir, 'feature_names.pkl')
    with open(features_path, 'wb') as f:
        pickle.dump(feature_names, f)
    print(f"  ✅ Saved feature_names.pkl")
    
    print(f"\n✅ All models saved successfully!")


def main():
    print("=" * 60)
    print("  E-Commerce Security ML Training")
    print("  HTTP Application-Level Features")
    print("=" * 60)
    
    # Load data
    data_file = 'synthetic_ecommerce_security_data.csv'
    if not os.path.exists(data_file):
        print(f"\n❌ Error: {data_file} not found!")
        print("Run: python generate_synthetic_data.py first")
        return
    
    X, y_multiclass, y_binary = load_and_prepare_data(data_file)
    
    # Split data
    print("\n🔀 Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_binary, 
        test_size=0.2, 
        random_state=42,
        stratify=y_binary
    )
    
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples: {len(X_test)}")
    
    # Scale features
    print("\n📏 Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train models
    models = train_models(X_train_scaled, X_test_scaled, y_train, y_test)
    
    # Feature importance (from Random Forest)
    print("\n📊 Top 10 Most Important Features:")
    rf = models['random_forest']
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': rf.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for i, row in feature_importance.head(10).iterrows():
        print(f"  {row['feature']:30s} {row['importance']:.4f}")
    
    # Save models
    save_models(models, scaler, list(X.columns))
    
    print("\n" + "=" * 60)
    print("✅ Training Complete!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("  1. Restart your backend: python backend/run.py")
    print("  2. Models will load automatically")
    print("  3. Test with Attacker Console")
    print("\n🎯 Expected behavior:")
    print("  - Normal browsing: Low risk (0.1-0.3)")
    print("  - Rapid scraping: High risk (0.8-1.0)")
    print("  - Data exfiltration: High risk (0.7-0.9)")
    print("  - Credential stuffing: High risk (0.8-1.0)")


if __name__ == "__main__":
    main()
