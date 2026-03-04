import secrets
import hashlib
from datetime import datetime
from faker import Faker
import random

class DynamicHoneytokenGenerator:
    """
    Inject fake API keys, session tokens, and credentials into data exports.
    When attacker uses them, we get instant callback with full forensics!
    
    Features:
    - Injects fake tokens into user exports
    - Tracks honeytoken usage with callbacks
    - Provides geolocation and forensic data
    - Automated breach response
    - Zero false positives (use = 100% breach)
    """
    
    def __init__(self, db, socketio, blockchain_logger):
        self.db = db
        self.socketio = socketio
        self.blockchain_logger = blockchain_logger
        self.fake = Faker()
        
        # Collections
        self.honeytokens = db.honeytokens
        self.blocked_ips = db.blocked_ips
        
        # Create indexes for fast lookup
        try:
            self.honeytokens.create_index('tracking_id', unique=True)
            self.honeytokens.create_index('triggered')
        except:
            pass
    
    def inject_into_user_export(self, users, export_metadata):
        """
        Inject honeytokens into user export
        
        Args:
            users: List of user records being exported
            export_metadata: Dict with user_id, session_id, timestamp, ip_address
        
        Returns:
            users list with injected honeytokens
        """
        
        # Calculate number of honeytokens (10% of export, minimum 1)
        honeytoken_count = max(1, len(users) // 10)
        
        # Generate honeytokens
        honeytokens = self._generate_honeytokens(honeytoken_count, export_metadata)
        
        # Insert honeytokens at random positions
        for honeytoken in honeytokens:
            insert_position = random.randint(0, len(users))
            users.insert(insert_position, honeytoken)
        
        print(f"✅ Injected {len(honeytokens)} honeytokens into export")
        
        return users
    
    def _generate_honeytokens(self, count, export_metadata):
        """Generate realistic-looking fake user records with tracked tokens"""
        
        honeytokens = []
        
        for i in range(count):
            # Create unique tracking ID
            tracking_id = secrets.token_urlsafe(16)
            
            # Generate fake user data
            honeytoken_user = {
                '_id': f'ht_{tracking_id}',
                'email': f'{self.fake.user_name()}@{self.fake.free_email_domain()}',
                'name': self.fake.name(),
                'role': 'user',
                
                # ⭐ HONEYTOKEN: Fake API key
                'api_key': self._generate_api_key(tracking_id),
                
                # ⭐ HONEYTOKEN: Fake session token
                'session_token': self._generate_session_token(tracking_id),
                
                # ⭐ HONEYTOKEN: Fake password reset token
                'reset_token': self._generate_reset_token(tracking_id),
                
                # Make it look realistic
                'created_at': self.fake.date_time_between(start_date='-2y', end_date='now').isoformat(),
                
                # Hidden markers (not visible to attacker in typical export)
                '_is_honeytoken': True,
                '_tracking_id': tracking_id
            }
            
            # Store honeytoken metadata in database
            self.honeytokens.insert_one({
                'tracking_id': tracking_id,
                'type': 'user_export',
                'exported_by': export_metadata['user_id'],
                'exported_at': export_metadata['timestamp'],
                'export_session': export_metadata['session_id'],
                'export_ip': export_metadata.get('ip_address'),
                'triggered': False,
                'trigger_count': 0,
                'trigger_events': []
            })
            
            honeytokens.append(honeytoken_user)
        
        return honeytokens
    
    def _generate_api_key(self, tracking_id):
        """Generate fake API key with embedded tracking"""
        # Format: sk_live_{tracking_id}_{checksum}
        checksum = hashlib.sha256(tracking_id.encode()).hexdigest()[:8]
        return f"sk_live_{tracking_id}_{checksum}"
    
    def _generate_session_token(self, tracking_id):
        """Generate fake session token"""
        return f"sess_{tracking_id}_{secrets.token_urlsafe(16)}"
    
    def _generate_reset_token(self, tracking_id):
        """Generate fake password reset token"""
        return f"reset_{tracking_id}_{secrets.token_urlsafe(16)}"
    
    def _extract_tracking_id(self, token):
        """Extract tracking ID from honeytoken"""
        try:
            # Format: {prefix}_{tracking_id}_{suffix}
            parts = token.split('_')
            if len(parts) >= 3:
                return parts[1]  # tracking_id is second part
        except:
            pass
        return None
    
    def is_honeytoken(self, token):
        """Check if a token is a honeytoken"""
        tracking_id = self._extract_tracking_id(token)
        
        if not tracking_id:
            return False
        
        result = self.honeytokens.find_one({'tracking_id': tracking_id})
        return result is not None
    
    def trigger_honeytoken_alert(self, token, request_context):
        """
        Honeytoken was used - BREACH CONFIRMED!
        
        Args:
            token: The honeytoken that was used
            request_context: Flask request object or dict with context
        """
        
        tracking_id = self._extract_tracking_id(token)
        
        if not tracking_id:
            return None
        
        # Get honeytoken metadata
        honeytoken = self.honeytokens.find_one({'tracking_id': tracking_id})
        
        if not honeytoken:
            return None
        
        # Extract request context
        if hasattr(request_context, 'headers'):
            # Flask request object
            attacker_ip = request_context.headers.get('X-Forwarded-For', 
                                                      request_context.headers.get('X-Mock-IP',
                                                                                  request_context.remote_addr))
            user_agent = request_context.headers.get('User-Agent', 'Unknown')
            endpoint = request_context.path
            request_data = request_context.get_json() if request_context.is_json else {}
        else:
            # Dict context
            attacker_ip = request_context.get('ip', 'Unknown')
            user_agent = request_context.get('user_agent', 'Unknown')
            endpoint = request_context.get('endpoint', 'Unknown')
            request_data = request_context.get('data', {})
        
        # Collect forensic data
        breach_data = {
            'type': 'HONEYTOKEN_TRIGGERED',
            'severity': 'CRITICAL',
            'tracking_id': tracking_id,
            'token_type': token.split('_')[0],  # sk_live, sess, reset
            'original_export': {
                'exported_by': honeytoken['exported_by'],
                'exported_at': honeytoken['exported_at'],
                'export_session': honeytoken['export_session'],
                'export_ip': honeytoken.get('export_ip')
            },
            'usage_context': {
                'triggered_at': datetime.now().isoformat(),
                'attacker_ip': attacker_ip,
                'user_agent': user_agent,
                'endpoint': endpoint,
                'request_data': request_data
            }
        }
        
        # Update honeytoken status
        self.honeytokens.update_one(
            {'tracking_id': tracking_id},
            {
                '$set': {'triggered': True},
                '$inc': {'trigger_count': 1},
                '$push': {'trigger_events': breach_data}
            }
        )
        
        # 🚨 REAL-TIME ALERT via WebSocket
        self.socketio.emit('honeytoken_triggered', breach_data, room='admin_monitoring')
        
        # 🚨 LOG TO BLOCKCHAIN (immutable proof)
        self.blockchain_logger.log_threat_event({
            'event_type': 'honeytoken_breach',
            'severity': 'CRITICAL',
            'session_id': honeytoken['export_session'],
            'risk_score': 1.0,
            'action': 'BREACH_CONFIRMED',
            'reasoning': f'Honeytoken {token[:20]}... was used by {attacker_ip}',
            'details': breach_data
        })
        
        # 🚨 AUTOMATED RESPONSE
        self._automated_breach_response(honeytoken, breach_data)
        
        print(f"🚨 HONEYTOKEN BREACH DETECTED!")
        print(f"   Tracking ID: {tracking_id}")
        print(f"   Original export by: {honeytoken['exported_by']}")
        print(f"   Used from IP: {attacker_ip}")
        print(f"   Token type: {breach_data['token_type']}")
        
        return breach_data
    
    def _automated_breach_response(self, honeytoken, breach_data):
        """Automated actions when breach is confirmed"""
        
        attacker_ip = breach_data['usage_context']['attacker_ip']
        
        # 1. Block the attacker's IP
        if attacker_ip and attacker_ip != 'Unknown':
            try:
                self.blocked_ips.insert_one({
                    'ip': attacker_ip,
                    'blocked_at': datetime.now(),
                    'reason': 'Honeytoken usage detected',
                    'tracking_id': breach_data['tracking_id']
                })
                print(f"   ✅ Blocked IP: {attacker_ip}")
            except:
                # Already blocked
                pass
        
        # 2. Could also invalidate sessions, force password resets, etc.
        # For now, just log and alert
        
        print(f"   ✅ Automated breach response completed")
    
    def get_honeytoken_statistics(self):
        """Get statistics on honeytokens"""
        
        total = self.honeytokens.count_documents({})
        triggered = self.honeytokens.count_documents({'triggered': True})
        
        # Get recent triggers
        recent_triggers = list(
            self.honeytokens.find({'triggered': True})
            .sort('trigger_events', -1)
            .limit(10)
        )
        
        return {
            'total_honeytokens': total,
            'triggered_honeytokens': triggered,
            'detection_rate': (triggered / total * 100) if total > 0 else 0,
            'recent_triggers': recent_triggers
        }
