"""
Simplified ML model training using synthetic data
Use this if you don't have the UNSW-NB15 dataset
"""

import numpy as np
import pickle
from pathlib import Path
from sklearn.ensemble import IsolationForest, RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
import xgboost as xgb

def generate_synthetic_data(n_samples=10000):
    """Generate synthetic network traffic data"""
    print("Generating synthetic training data...")
    
    # Feature columns
    feature_cols = [
        'request_rate', 'response_rate', 'data_sent_mb', 
        'data_received_mb', 'total_data_mb', 'duration_seconds',
        'upload_load_mbps', 'download_load_mbps', 'packet_ratio',
        'mean_packet_size_sent', 'mean_packet_size_received',
        'is_http', 'is_https', 'http_method_count', 
        'is_established', 'state_ttl_count',
        'inter_packet_time_sent', 'inter_packet_time_received'
    ]
    
    # Normal traffic (80%)
    n_normal = int(n_samples * 0.8)
    normal_data = np.random.rand(n_normal, len(feature_cols))
    
    # Scale features to realistic ranges
    normal_data[:, 0] = normal_data[:, 0] * 10  # request_rate: 0-10
    normal_data[:, 1] = normal_data[:, 1] * 10  # response_rate: 0-10
    normal_data[:, 2] = normal_data[:, 2] * 5   # data_sent_mb: 0-5
    normal_data[:, 3] = normal_data[:, 3] * 10  # data_received_mb: 0-10
    normal_data[:, 4] = normal_data[:, 2] + normal_data[:, 3]  # total_data_mb
    normal_data[:, 5] = normal_data[:, 5] * 60  # duration_seconds: 0-60
    normal_data[:, 11] = np.random.randint(0, 2, n_normal)  # is_http
    normal_data[:, 12] = np.random.randint(0, 2, n_normal)  # is_https
    normal_data[:, 13] = np.random.randint(1, 5, n_normal)  # http_method_count
    normal_data[:, 14] = np.random.randint(0, 2, n_normal)  # is_established
    
    normal_labels = np.zeros(n_normal)
    
    # Attack traffic (20%)
    n_attack = n_samples - n_normal
    attack_data = np.random.rand(n_attack, len(feature_cols))
    
    # Attacks have different patterns
    attack_data[:, 0] = attack_data[:, 0] * 100 + 20  # High request_rate
    attack_data[:, 1] = attack_data[:, 1] * 5   # Lower response_rate
    attack_data[:, 2] = attack_data[:, 2] * 20  # High data_sent
    attack_data[:, 3] = attack_data[:, 3] * 2   # Low data_received
    attack_data[:, 4] = attack_data[:, 2] + attack_data[:, 3]
    attack_data[:, 5] = attack_data[:, 5] * 10  # Short duration
    attack_data[:, 11] = np.random.randint(0, 2, n_attack)
    attack_data[:, 12] = np.random.randint(0, 2, n_attack)
    attack_data[:, 13] = np.random.randint(5, 20, n_attack)  # Many methods
    attack_data[:, 14] = np.random.randint(0, 2, n_attack)
    
    attack_labels = np.ones(n_attack)
    
    # Combine
    X = np.vstack([normal_data, attack_data])
    y = np.hstack([normal_labels, attack_labels])
    
    # Shuffle
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]
    
    print(f"✓ Generated {len(X)} samples ({n_normal} normal, {n_attack} attack)")
    
    return X, y, feature_cols

def train_models():
    """Train all ensemble models"""
    print("\n🚀 Starting ML Model Training...\n")
    
    # Generate data
    X, y, feature_cols = generate_synthetic_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples\n")
    
    models = {}
    
    # Model 1: Isolation Forest
    print("1️⃣ Training Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.2,
        random_state=42
    )
    iso_forest.fit(X_train)
    models['isolation_forest'] = iso_forest
    print("   ✓ Trained\n")
    
    # Model 2: XGBoost
    print("2️⃣ Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train)
    models['xgboost'] = xgb_model
    print("   ✓ Trained\n")
    
    # Model 3: Random Forest
    print("3️⃣ Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    rf_model.fit(X_train, y_train)
    models['random_forest'] = rf_model
    print("   ✓ Trained\n")
    
    # Model 4: Voting Ensemble
    print("4️⃣ Training Voting Ensemble...")
    voting_clf = VotingClassifier(
        estimators=[
            ('xgb', xgb_model),
            ('rf', rf_model)
        ],
        voting='soft',
        weights=[2, 1]
    )
    voting_clf.fit(X_train, y_train)
    models['voting_ensemble'] = voting_clf
    print("   ✓ Trained\n")
    
    # Evaluate
    print("📊 Model Evaluation:\n")
    for name, model in models.items():
        if name == 'isolation_forest':
            y_pred = model.predict(X_test)
            y_pred = np.where(y_pred == -1, 1, 0)
        else:
            y_pred = model.predict(X_test)
        
        accuracy = np.mean(y_pred == y_test)
        print(f"{name}: Accuracy = {accuracy:.4f}")
    
    # Save models
    print("\n💾 Saving models...")
    models_dir = Path('models')
    models_dir.mkdir(exist_ok=True)
    
    for name, model in models.items():
        filepath = models_dir / f'{name}.pkl'
        with open(filepath, 'wb') as f:
            pickle.dump(model, f)
        print(f"   ✓ Saved {name}")
    
    # Save feature columns
    with open(models_dir / 'feature_cols.pkl', 'wb') as f:
        pickle.dump(feature_cols, f)
    print("   ✓ Saved feature_cols")
    
    print("\n✅ Training complete!")
    print(f"Models saved to: {models_dir.absolute()}")
    print("\nTo use these models:")
    print("1. Copy the 'models' folder to 'ml_pipeline/models/'")
    print("2. Restart the backend server")
    print("3. Models will be automatically loaded")

if __name__ == '__main__':
    train_models()
