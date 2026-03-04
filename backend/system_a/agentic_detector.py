import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict, deque
import os

class AgenticThreatDetector:
    """
    Autonomous AI agent for threat detection
    
    Capabilities:
    - Self-learning from feedback
    - Adaptive threshold adjustment
    - Context-aware decision making
    - Autonomous response selection
    """
    
    def __init__(self, models_dir=None):
        if models_dir is None:
            # Calculate absolute path relative to this file
            # backend/system_a/agentic_detector.py -> backend/system_a -> backend
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            models_dir = os.path.join(base_dir, 'ml_pipeline', 'models')

        # Scaler for feature normalization
        self.scaler = None
        
        # Load all trained models
        self.models = self._load_models(models_dir)
        
        # Agentic memory
        self.session_memory = defaultdict(lambda: {
            'requests': deque(maxlen=100),
            'risk_scores': deque(maxlen=50),
            'actions_taken': [],
            'feedback': [],
            'accumulated_penalty': 0.0,
            'first_seen': datetime.now()
        })
        
        # Adaptive thresholds (self-adjusting)
        self.thresholds = {
            'low': 0.3,
            'medium': 0.5,
            'high': 0.7,
            'critical': 0.9
        }
        
        # Learning rate
        self.learning_rate = 0.01
        
        # Decision history
        self.decision_history = []
        
        # Feature columns (HTTP-appropriate, matches training data)
        self.feature_cols = [
            'request_rate', 'unique_endpoints', 'endpoint_diversity',
            'repeat_request_ratio', 'failed_request_ratio', 'post_get_ratio',
            'session_duration_min', 'total_requests', 'avg_time_between_requests',
            'request_time_variance', 'requests_per_minute', 'total_data_transferred_mb',
            'avg_response_size_kb', 'sensitive_endpoint_access', 'bulk_query_indicator',
            'sequential_id_access', 'known_browser', 'user_agent_changes',
            'missing_headers', 'has_referer', 'javascript_enabled', 'night_activity',
            'weekend_activity', 'off_hours_ratio', 'sql_injection_patterns',
            'xss_patterns', 'path_traversal_patterns', 'authentication_failures',
            'canary_access_count'
        ]
    
    def _load_models(self, models_dir):
        """Load all ensemble models with HTTP-appropriate features"""
        models = {}
        
        # Check if models exist
        if not os.path.exists(models_dir):
            print(f"⚠ Models directory not found: {models_dir}")
            print("  Using fallback detection (train models for full functionality)")
            return models
        
        # Load scaler first
        scaler_path = os.path.join(models_dir, 'scaler.pkl')
        if os.path.exists(scaler_path):
            try:
                with open(scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print("✓ Loaded feature scaler")
            except Exception as e:
                print(f"⚠ Failed to load scaler: {e}")
        
        # Load ML models
        model_files = [
            'isolation_forest.pkl',
            'xgboost.pkl',
            'random_forest.pkl',
            'voting_ensemble.pkl',
            'logistic_regression.pkl'
        ]
        
        for filename in model_files:
            name = filename.replace('.pkl', '')
            filepath = os.path.join(models_dir, filename)
            try:
                with open(filepath, 'rb') as f:
                    models[name] = pickle.load(f)
                print(f"✓ Loaded {name}")
            except FileNotFoundError:
                print(f"⚠ Model {name} not found")
            except Exception as e:
                print(f"⚠ Error loading {name}: {e}")
        
        if len(models) > 0:
            print(f"✅ ML Models Enabled: {len(models)} models loaded")
        else:
            print("⚠️  No ML models loaded - using fallback mode")
        
        return models
    
    def extract_features(self, request_data, session_id):
        """Extract HTTP application-level features from request"""
        session = self.session_memory[session_id]
        session['requests'].append(request_data)
        
        # Calculate session statistics
        requests = list(session['requests'])
        
        if len(requests) < 2:
            return None
        
        # Time-based calculations
        try:
            last_req_time = datetime.fromisoformat(requests[-1]['timestamp'])
            first_req_time = datetime.fromisoformat(requests[0]['timestamp'])
            duration = (last_req_time - first_req_time).total_seconds()
            
            # ✅ BUG FIX: "Cold Start" False Positives
            # Problem: Training data "Normal" has rate 0.5-3.0 and avg_time 3.0-10.0
            # Solution: For short sessions, verify we force these values into "Normal" range.
            
            # If session has few requests (< 5), force a "Normal" pace
            if len(requests) < 5:
                # Force Rate to ~1.0 req/sec (Safe Normal)
                # We do this by setting duration = request_count
                min_duration = float(len(requests))
            else:
                min_duration = 0.5  # Standard floor for longer sessions
                
            if duration < min_duration:
                duration = min_duration
        except (ValueError, KeyError):
            duration = (datetime.now() - session['first_seen']).total_seconds()
            if duration < 0.5:
                duration = 0.5

        # Helper functions (Local scope for cleaner code)
        def get_unique_endpoints():
            return len(set(r.get('endpoint', '') for r in requests))
        
        def get_endpoint_diversity():
            unique = get_unique_endpoints()
            return unique / len(requests) if len(requests) > 0 else 0
        
        def get_repeat_ratio():
            if len(requests) == 0: return 0
            endpoint_counts = {}
            for r in requests:
                ep = r.get('endpoint', '')
                endpoint_counts[ep] = endpoint_counts.get(ep, 0) + 1
            max_count = max(endpoint_counts.values()) if endpoint_counts else 0
            return max_count / len(requests)
        
        def get_failed_ratio():
            failed = len([r for r in requests if r.get('status_code', 200) >= 400])
            return failed / len(requests) if len(requests) > 0 else 0
        
        def get_post_get_ratio():
            post_count = len([r for r in requests if r.get('method', 'GET') == 'POST'])
            get_count = len([r for r in requests if r.get('method', 'GET') == 'GET'])
            return post_count / get_count if get_count > 0 else 0
        
        def get_time_variance():
            if len(requests) < 2: return 0
            times = []
            for i in range(1, len(requests)):
                try:
                    t1 = datetime.fromisoformat(requests[i-1]['timestamp'])
                    t2 = datetime.fromisoformat(requests[i]['timestamp'])
                    times.append((t2 - t1).total_seconds())
                except: pass
            return np.std(times) if len(times) > 0 else 0

        def get_avg_interval():
            if len(requests) < 2: return 0
            try:
                t1 = datetime.fromisoformat(requests[0]['timestamp'])
                t2 = datetime.fromisoformat(requests[-1]['timestamp'])
                return (t2 - t1).total_seconds() / (len(requests) - 1)
            except: return 0
        
        def is_sensitive_endpoint():
            endpoint = request_data.get('endpoint', '')
            return 1 if '/admin/' in endpoint or '/export' in endpoint else 0
        
        def is_known_browser():
            ua = request_data.get('user_agent', '')
            if not ua: return 0
            known = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
            return 1 if any(browser in ua for browser in known) else 0
        
        def is_night():
            h = datetime.now().hour
            return 1 if h < 6 or h > 22 else 0
        
        def is_weekend():
            return 1 if datetime.now().weekday() >= 5 else 0

        # Session behavior
        # ✅ BURST SMOOTHING: Fix for "Cold Start" false positives
        # Legitimate browsers send parallel requests (0.05s apart) on page load.
        # We floor this value to 3.0s (Normal average) for new sessions.
        avg_time = get_avg_interval()
        if len(requests) < 5 and avg_time < 3.0:
            avg_time = 3.0
            
        # Calculate all HTTP features
        features = {
            # Request patterns
            'request_rate': len(requests) / duration,
            'unique_endpoints': get_unique_endpoints(),
            'endpoint_diversity': get_endpoint_diversity(),
            'repeat_ratio': get_repeat_ratio(),  # Matches training data col name
            'failed_ratio': get_failed_ratio(),
            'post_get_ratio': get_post_get_ratio(),
            'repeat_request_ratio': get_repeat_ratio(), # Duplicate for safety if col name varies
            'failed_request_ratio': get_failed_ratio(), # Duplicate for safety
            
            # Session behavior
            'session_duration_min': duration / 60,
            'total_requests': len(requests),
            'avg_time_between': avg_time,
            'avg_time_between_requests': avg_time, # Duplicate for safety
            'time_variance': get_time_variance(),
            'request_time_variance': get_time_variance(), # Duplicate
            'requests_per_minute': len(requests) / (duration / 60) if duration > 0 else 0,
            'total_data_transferred_mb': sum(r.get('response_size', 0) for r in requests) / (1024*1024),
            'avg_response_size_kb': np.mean([r.get('response_size', 0) for r in requests]) / 1024,
            'sensitive_endpoint_access': is_sensitive_endpoint(),
            'bulk_query_indicator': 0,
            'sequential_id_access': 0,
            'known_browser': is_known_browser(),
            'user_agent_changes': len(set(r.get('user_agent', '') for r in requests)),
            'missing_headers': 0,
            'has_referer': 1 if request_data.get('referer') else 0,
            'javascript_enabled': 1,
            'night_activity': is_night(),
            'weekend_activity': is_weekend(),
            'off_hours_ratio': 0,
            'sql_injection_patterns': 0,
            'xss_patterns': 0,
            'path_traversal_patterns': 0,
            'authentication_failures': 0,
            'canary_access_count': 0
        }
        
        # Convert to array using ONLY the columns expected by the model
        feature_vector = np.array([features.get(col, 0) for col in self.feature_cols])
        
        return feature_vector
    
    def predict_threat(self, features):
        """Run all ensemble models and aggregate predictions"""
        if features is None or not self.models:
            # Fallback: simple heuristic
            return {'risk_score': 0.1, 'model_votes': {}, 'confidence': 0.5}
        
        # Normalize features using scaler (same as training)
        if self.scaler is not None:
            # Fix UserWarning: Create DataFrame with feature names
            features_df = pd.DataFrame([features], columns=self.feature_cols)
            features_scaled = self.scaler.transform(features_df)[0]
        else:
            features_scaled = features
        
        votes = {}
        probabilities = []
        
        # Get predictions from all models
        for name, model in self.models.items():
            try:
                if name == 'isolation_forest':
                    pred = model.predict([features_scaled])[0]
                    votes[name] = 1 if pred == -1 else 0
                    probabilities.append(1.0 if pred == -1 else 0.0)
                
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba([features_scaled])[0]
                    votes[name] = int(np.argmax(proba))
                    probabilities.append(float(proba[1]) if len(proba) > 1 else float(proba[0]))
                
                else:
                    pred = model.predict([features_scaled])[0]
                    # Map -1 to 1 (attack) for Isolation Forest
                    if name == 'isolation_forest':
                        votes[name] = 1 if pred == -1 else 0
                        probabilities.append(1.0 if pred == -1 else 0.0)
                    else:
                        votes[name] = int(pred)
                        probabilities.append(float(pred))
            except Exception as e:
                print(f"Error in model {name}: {e}")
                continue
        
        # Aggregate risk score
        risk_score = float(np.mean(probabilities)) if probabilities else 0.1
        confidence = float(1.0 - np.std(probabilities)) if len(probabilities) > 1 else 0.5
        
        return {
            'risk_score': risk_score,
            'model_votes': votes,
            'confidence': confidence
        }
    
    def autonomous_decision(self, session_id, risk_score, context):
        """Agentic decision-making based on risk and context"""
        session = self.session_memory[session_id]
        
        # Context-aware threshold adjustment
        adjusted_thresholds = self.thresholds.copy()
        
        # Adjust for role
        if context.get('role') == 'admin':
            for key in adjusted_thresholds:
                adjusted_thresholds[key] += 0.1
        
        # Adjust for time (off-hours more suspicious)
        request_time = context.get('time', datetime.now())
        if isinstance(request_time, str):
            try:
                request_time = datetime.fromisoformat(request_time)
            except ValueError:
                request_time = datetime.now()
        
        if request_time.hour < 6 or request_time.hour > 22:
            for key in adjusted_thresholds:
                adjusted_thresholds[key] -= 0.1
        
        # Adjust based on history
        if len(session['risk_scores']) > 5:
            avg_historical_risk = np.mean(list(session['risk_scores']))
            if avg_historical_risk > 0.5:
                for key in adjusted_thresholds:
                    adjusted_thresholds[key] -= 0.05
        
        # Persistence Penalty: Escalate if user ignores throttling
        if len(session['actions_taken']) > 0:
            last_action = session['actions_taken'][-1]['action']
            if last_action == 'throttle':
                session['accumulated_penalty'] += 0.05 # Add 5% permanent penalty
                risk_score = min(1.0, risk_score + session['accumulated_penalty'])
                context['persistence_penalty'] = True
            elif last_action == 'shadow_ban':
                session['accumulated_penalty'] += 0.1 # Add 10% permanent penalty
                risk_score = min(1.0, risk_score + session['accumulated_penalty'])
        
        # 🛡️ GRACE PERIOD: Don't block during initial requests (page loads)
        # Only monitor for first 5 requests to avoid false positives
        session_request_count = len(session['requests'])
        
        # Decision logic
        if risk_score >= adjusted_thresholds['critical']:
            # Don't block if still in grace period
            if session_request_count < 5:
                action = 'monitor'
                reasoning = f"Critical risk detected BUT grace period active (only {session_request_count} requests)"
            else:
                action = 'block'
                reasoning = f"Critical threat detected (score: {risk_score:.2f})"
        
        elif risk_score >= adjusted_thresholds['high']:
            # Don't shadow_ban if still in grace period
            if session_request_count < 5:
                action = 'monitor'
                reasoning = f"High risk detected BUT grace period active (only {session_request_count} requests)"
            else:
                action = 'shadow_ban'
                reasoning = f"High risk - deploying shadow ban (score: {risk_score:.2f})"
        
        elif risk_score >= adjusted_thresholds['medium']:
            action = 'throttle'
            reasoning = f"Medium risk - applying rate limiting (score: {risk_score:.2f})"
        
        elif risk_score >= adjusted_thresholds['low']:
            action = 'monitor'
            reasoning = f"Low risk - increased monitoring (score: {risk_score:.2f})"
        
        else:
            action = 'allow'
            reasoning = f"Normal behavior (score: {risk_score:.2f})"
        
        # Store decision
        decision = {
            'session_id': session_id,
            'timestamp': datetime.now().isoformat(),
            'risk_score': risk_score,
            'action': action,
            'reasoning': reasoning,
            'thresholds_used': adjusted_thresholds,
            'context': context
        }
        
        session['actions_taken'].append(decision)
        session['risk_scores'].append(risk_score)
        self.decision_history.append(decision)
        
        return decision
    
    def get_session_status(self, session_id):
        """Check current status of a session based on history"""
        if session_id not in self.session_memory:
            return 'allow'
            
        session = self.session_memory[session_id]
        
        # 1. IMMEDIATE BLOCK: If the last action was 'block', keep blocking!
        if len(session['actions_taken']) > 0:
            if session['actions_taken'][-1]['action'] == 'block':
                return 'block'
        
        # 2. PERSISTENT BLOCK: If risk is simply too high
        if len(session['risk_scores']) > 0:
            current_risk = session['risk_scores'][-1]
            if current_risk > 0.95: # Critical threshold
                return 'block'
                
        return 'allow'

    def reset_session(self, session_id=None, ip=None):
        """Reset session memory (used for unban)"""
        # Reset by Session ID
        if session_id and session_id in self.session_memory:
            del self.session_memory[session_id]
            print(f"✓ Reset session {session_id}")
            return
            
        # Reset by IP (Scanning all sessions - simple implementation for demo)
        if ip:
            sessions_to_remove = []
            for sess_id, data in self.session_memory.items():
                # Check recent requests for this IP
                if any(r.get('ip') == ip for r in data['requests']):
                    sessions_to_remove.append(sess_id)
            
            for sess_id in sessions_to_remove:
                # Fully delete the session so it starts fresh without 'block' history
                del self.session_memory[sess_id]
            
            print(f"✓ Reset {len(sessions_to_remove)} sessions for IP {ip}")

    def analyze_request(self, request_data, session_id):
        """Main entry point - analyze a request"""
        # Extract features
        features = self.extract_features(request_data, session_id)
        
        # Predict threat
        prediction = self.predict_threat(features)
        
        # Make autonomous decision
        context = {
            'role': request_data.get('role', 'user'),
            'endpoint': request_data.get('endpoint', ''),
            'time': datetime.now().isoformat(),
            'history': list(self.session_memory[session_id]['risk_scores'])
        }
        
        decision = self.autonomous_decision(
            session_id,
            prediction['risk_score'],
            context
        )
        
        # Combine results
        result = {
            **prediction,
            **decision,
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id
        }
        
        return result
