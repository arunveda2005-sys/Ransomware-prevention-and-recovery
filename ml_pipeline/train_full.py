import pandas as pd
import numpy as np
import pickle
import os
from pathlib import Path
from sklearn.ensemble import IsolationForest, RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

def load_and_preprocess(filepath):
    """Load Parquet and map features to AgenticDetector requirements"""
    print(f"Loading {filepath}...")
    df = pd.read_parquet(filepath)
    
    # Map UNSW-NB15 columns to Agentic Features
    print("Mapping features...")
    
    # Initialize feature dataframe
    X = pd.DataFrame()
    
    # 1. Traffic Rates
    X['request_rate'] = df['rate']
    # Approximation: response rate (pkts/sec) - using destination packets / duration
    # Avoid division by zero
    dur = df['dur'].replace(0, 0.000001)
    X['response_rate'] = df['dpkts'] / dur
    
    # 2. Data Volume (Bytes -> MB)
    X['data_sent_mb'] = df['sbytes'] / (1024 * 1024)
    X['data_received_mb'] = df['dbytes'] / (1024 * 1024)
    X['total_data_mb'] = X['data_sent_mb'] + X['data_received_mb']
    
    # 3. Timing
    X['duration_seconds'] = df['dur']
    
    # 4. Load (bits/sec -> Mbps)
    X['upload_load_mbps'] = df['sload'] / 1e6
    X['download_load_mbps'] = df['dload'] / 1e6
    
    # 5. Packet Ratios
    # Avoid division by zero
    spkts = df['spkts'].replace(0, 1)
    X['packet_ratio'] = df['dpkts'] / spkts
    
    X['mean_packet_size_sent'] = df['smean']
    X['mean_packet_size_received'] = df['dmean']
    
    # 6. Protocol/Service (One-Hot / Binary)
    # Check if column exists, otherwise default to 0
    if 'service' in df.columns:
        X['is_http'] = (df['service'] == 'http').astype(int)
        X['is_https'] = (df['service'].isin(['ssl', 'https'])).astype(int)
    else:
        X['is_http'] = 0
        X['is_https'] = 0
        
    if 'ct_flw_http_mthd' in df.columns:
        X['http_method_count'] = df['ct_flw_http_mthd'].fillna(0)
    else:
        X['http_method_count'] = 0
        
    # 7. State
    if 'state' in df.columns:
        X['is_established'] = (df['state'].isin(['CON', 'FIN'])).astype(int)
    else:
        X['is_established'] = 1
        
    if 'ct_state_ttl' in df.columns:
        X['state_ttl_count'] = df['ct_state_ttl']
    else:
        X['state_ttl_count'] = 0
        
    # 8. Inter-arrival times
    X['inter_packet_time_sent'] = df['sinpkt']
    X['inter_packet_time_received'] = df['dinpkt']
    
    # Feature columns used in AgenticDetector
    required_cols = [
        'request_rate', 'response_rate', 'data_sent_mb', 
        'data_received_mb', 'total_data_mb', 'duration_seconds',
        'upload_load_mbps', 'download_load_mbps', 'packet_ratio',
        'mean_packet_size_sent', 'mean_packet_size_received',
        'is_http', 'is_https', 'http_method_count', 
        'is_established', 'state_ttl_count',
        'inter_packet_time_sent', 'inter_packet_time_received'
    ]
    
    # Ensure all columns exist and fill NaNs
    for col in required_cols:
        if col not in X.columns:
            X[col] = 0
        X[col] = X[col].fillna(0)
            
    # Labels (1 = Attack, 0 = Normal)
    # UNSW-NB15 has 'label' column
    y = df['label'] if 'label' in df.columns else np.zeros(len(df))
    
    return X[required_cols], y, required_cols

def train_models():
    """Train models using full dataset"""
    print("\n🚀 Starting FULL Model Training...\n")
    
    # Paths
    base_dir = Path(__file__).parent.parent 
    train_path = base_dir / 'ml_pipeline' / 'data' / 'UNSW_NB15_training-set.parquet'
    
    if not train_path.exists():
        print(f"Error: Training file not found at {train_path}")
        return

    # Load Data
    X, y, feature_cols = load_and_preprocess(train_path)
    
    print(f"Data Loaded. Shape: {X.shape}")
    print(f"Attack samples: {y.sum()} / {len(y)}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    models = {}
    
    # 1. Isolation Forest (Unsupervised)
    print("1️⃣ Training Isolation Forest...")
    iso_forest = IsolationForest(
        n_estimators=100, 
        contamination=0.1, 
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train)
    models['isolation_forest'] = iso_forest
    print("   ✓ Trained")
    
    # 2. XGBoost
    print("2️⃣ Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train)
    models['xgboost'] = xgb_model
    print("   ✓ Trained")
    
    # 3. Random Forest
    print("3️⃣ Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    models['random_forest'] = rf_model
    print("   ✓ Trained")
    
    # 4. Voting Ensemble
    print("4️⃣ Training Voting Ensemble...")
    voting_clf = VotingClassifier(
        estimators=[('xgb', xgb_model), ('rf', rf_model)],
        voting='soft',
        weights=[2, 1]
    )
    voting_clf.fit(X_train, y_train)
    models['voting_ensemble'] = voting_clf
    print("   ✓ Trained")
    
    # Evaluation
    print("\n📊 Evaluation (Accuracy):")
    for name, model in models.items():
        if name == 'isolation_forest':
            # Map -1 (anomaly) to 1 (attack)
            y_pred = np.where(model.predict(X_test) == -1, 1, 0)
        else:
            y_pred = model.predict(X_test)
        
        acc = np.mean(y_pred == y_test)
        print(f"{name}: {acc:.2%}")

    # Save Models
    models_dir = base_dir / 'ml_pipeline' / 'models'
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("\n💾 Saving models...")
    for name, model in models.items():
        with open(models_dir / f'{name}.pkl', 'wb') as f:
            pickle.dump(model, f)
            
    with open(models_dir / 'feature_cols.pkl', 'wb') as f:
        pickle.dump(feature_cols, f)
        
    print(f"\n✅ Done! Models saved to {models_dir}")

if __name__ == '__main__':
    train_models()
