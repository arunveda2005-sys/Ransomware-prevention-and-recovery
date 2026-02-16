import pickle
import numpy as np
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
        
        # Feature columns
        self.feature_cols = [
            'request_rate', 'response_rate', 'data_sent_mb', 
            'data_received_mb', 'total_data_mb', 'duration_seconds',
            'upload_load_mbps', 'download_load_mbps', 'packet_ratio',
            'mean_packet_size_sent', 'mean_packet_size_received',
            'is_http', 'is_https', 'http_method_count', 
            'is_established', 'state_ttl_count',
            'inter_packet_time_sent', 'inter_packet_time_received'
        ]
    
    def _load_models(self, models_dir):
        """Load all ensemble models"""
        models = {}
        
        # Check if models exist
        if not os.path.exists(models_dir):
            print(f"⚠ Models directory not found: {models_dir}")
            print("  Using fallback detection (train models for full functionality)")
            return models
        
        model_files = [
            'isolation_forest.pkl',
            'xgboost.pkl',
            'random_forest.pkl',
            'voting_ensemble.pkl',
            'stacking_ensemble.pkl'
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
        
        return models
    
    def extract_features(self, request_data, session_id):
        """Extract features from request"""
        session = self.session_memory[session_id]
        session['requests'].append(request_data)
        
        # Calculate session statistics
        requests = list(session['requests'])
        
        if len(requests) < 2:
            return None
        
        # Time-based features
        # BUG FIX: Use sliding window duration instead of session age
        # This prevents "dormant sessions" from diluting the request rate
        try:
            last_req_time = datetime.fromisoformat(requests[-1]['timestamp'])
            first_req_time = datetime.fromisoformat(requests[0]['timestamp'])
            duration = (last_req_time - first_req_time).total_seconds()
            if duration < 0.001: duration = 0.001 # Prevent division by zero
        except (ValueError, KeyError):
            # Fallback if timestamp missing or invalid
            duration = (datetime.now() - session['first_seen']).total_seconds() + 0.001

        # Calculate features
        features = {
            'request_rate': len(requests) / duration,
            'response_rate': len([r for r in requests if r.get('status_code', 200) == 200]) / duration,
            'data_sent_mb': sum(r.get('request_size', 0) for r in requests) / (1024*1024),
            'data_received_mb': sum(r.get('response_size', 0) for r in requests) / (1024*1024),
            'total_data_mb': sum(r.get('response_size', 0) + r.get('request_size', 0) for r in requests) / (1024*1024),
            'duration_seconds': duration,
            'upload_load_mbps': (sum(r.get('request_size', 0) for r in requests) / duration) / (1024*1024),
            'download_load_mbps': (sum(r.get('response_size', 0) for r in requests) / duration) / (1024*1024),
            'packet_ratio': 1.0,
            'mean_packet_size_sent': np.mean([r.get('request_size', 0) for r in requests]),
            'mean_packet_size_received': np.mean([r.get('response_size', 0) for r in requests]),
            'is_http': 1 if request_data.get('endpoint', '').startswith('/api') else 0,
            'is_https': 1,
            'http_method_count': len(set(r.get('method', 'GET') for r in requests)),
            'is_established': 1,
            'state_ttl_count': len(requests),
            'inter_packet_time_sent': np.mean(np.diff([0] + [i for i in range(len(requests))])) if len(requests) > 1 else 0,
            'inter_packet_time_received': np.mean(np.diff([0] + [i for i in range(len(requests))])) if len(requests) > 1 else 0
        }
        
        # Convert to array
        feature_vector = np.array([features[col] for col in self.feature_cols])
        
        return feature_vector
    
    def predict_threat(self, features):
        """Run all ensemble models and aggregate predictions"""
        if features is None or not self.models:
            # Fallback: simple heuristic
            return {'risk_score': 0.1, 'model_votes': {}, 'confidence': 0.5}
        
        votes = {}
        probabilities = []
        
        # Get predictions from all models
        for name, model in self.models.items():
            try:
                if name == 'isolation_forest':
                    pred = model.predict([features])[0]
                    votes[name] = 1 if pred == -1 else 0
                    probabilities.append(1.0 if pred == -1 else 0.0)
                
                if hasattr(model, 'predict_proba'):
                    proba = model.predict_proba([features])[0]
                    votes[name] = int(np.argmax(proba))
                    probabilities.append(float(proba[1]) if len(proba) > 1 else float(proba[0]))
                
                else:
                    pred = model.predict([features])[0]
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
        
        # Decision logic
        if risk_score >= adjusted_thresholds['critical']:
            action = 'block'
            reasoning = f"Critical threat detected (score: {risk_score:.2f})"
        
        elif risk_score >= adjusted_thresholds['high']:
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
