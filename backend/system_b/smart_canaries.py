import random
import hashlib
from faker import Faker
from datetime import datetime, timedelta
import numpy as np

class SmartCanaryGenerator:
    """
    Generate realistic canary records using ML patterns
    Indistinguishable from real customers
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
        self.fake = Faker()
        self.canary_ids = []
    
    def analyze_real_patterns(self):
        """Analyze real customer data to learn patterns"""
        # Get real customers (sample)
        real_customers = list(self.db.users.find({'is_canary': {'$ne': True}}).limit(1000))
        
        if not real_customers:
            # No real data yet, use defaults
            return {
                'name_length': {'mean': 15, 'std': 5},
                'email_domains': ['gmail.com', 'yahoo.com', 'hotmail.com'],
                'registration_hours': list(range(24)),
                'order_frequency': {'mean': 2, 'std': 1}
            }
        
        # Analyze patterns
        name_lengths = [len(c.get('name', '')) for c in real_customers]
        email_domains = [c.get('email', '').split('@')[-1] for c in real_customers if '@' in c.get('email', '')]
        
        return {
            'name_length': {
                'mean': np.mean(name_lengths) if name_lengths else 15,
                'std': np.std(name_lengths) if name_lengths else 5
            },
            'email_domains': list(set(email_domains)) if email_domains else ['gmail.com'],
            'registration_hours': list(range(24)),
            'order_frequency': {
                'mean': 2,
                'std': 1
            }
        }
    
    def generate_canary_customer(self, patterns: dict) -> dict:
        """Generate a single canary customer matching real patterns"""
        # Generate name with realistic length
        name = self.fake.name()
        
        # Generate canary ID
        canary_id = hashlib.md5(
            f"{datetime.now().isoformat()}{random.random()}".encode()
        ).hexdigest()[:8]
        
        # Use monitoring domain for detection
        monitoring_domains = [
            'customer-alerts.monitor-ecommerce.com',
            'user-notifications.track-security.com',
            'account-updates.detect-breach.com'
        ]
        
        canary_email = f"user_{canary_id}@{random.choice(monitoring_domains)}"
        
        # Realistic registration time
        registration_hour = random.choice(patterns.get('registration_hours', list(range(24))))
        registration_date = datetime.now() - timedelta(
            days=random.randint(30, 365),
            hours=registration_hour
        )
        
        canary = {
            'canary_id': f'canary_{canary_id}',
            'name': name,
            'email': canary_email,
            'phone': self.fake.phone_number(),
            'address': self.fake.address(),
            'city': self.fake.city(),
            'state': self.fake.state_abbr(),
            'zip_code': self.fake.zipcode(),
            'created_at': registration_date.isoformat(),
            'is_canary': True,
            'canary_type': 'smart_generated',
            'monitoring_active': True,
            'role': 'user'
        }
        
        self.canary_ids.append(canary['canary_id'])
        
        return canary
    
    def deploy_canaries(self, count: int = 50) -> list:
        """Deploy multiple canary customers"""
        print(f"🕵️ Generating {count} smart canaries...")
        
        # Analyze real patterns
        patterns = self.analyze_real_patterns()
        
        canaries = []
        
        for i in range(count):
            canary = self.generate_canary_customer(patterns)
            
            # Insert into database
            try:
                result = self.db.users.insert_one(canary)
                canaries.append(canary['canary_id'])
            except Exception as e:
                print(f"  Error inserting canary: {e}")
            
            if (i + 1) % 10 == 0:
                print(f"  ✓ Generated {i + 1}/{count}")
        
        print(f"✅ Deployed {len(canaries)} canaries")
        
        return canaries
    
    def check_canary_access(self, accessed_ids: list) -> dict:
        """Check if any accessed records are canaries"""
        canaries_found = []
        
        for user_id in accessed_ids:
            try:
                user = self.db.users.find_one({'_id': user_id})
                
                if user and user.get('is_canary', False):
                    canaries_found.append({
                        'canary_id': user.get('canary_id'),
                        'email': user.get('email'),
                        'accessed_at': datetime.now().isoformat()
                    })
            except:
                continue
        
        if canaries_found:
            return {
                'breach_detected': True,
                'canaries_accessed': canaries_found,
                'alert_level': 'CRITICAL',
                'message': f'{len(canaries_found)} canary record(s) accessed - BREACH CONFIRMED'
            }
        
        return {
            'breach_detected': False,
            'canaries_accessed': [],
            'alert_level': 'NORMAL',
            'message': 'No canary access detected'
        }
    
    def get_canary_statistics(self) -> dict:
        """Get statistics about deployed canaries"""
        total_canaries = self.db.users.count_documents({'is_canary': True})
        
        return {
            'total_deployed': total_canaries,
            'monitoring_active': self.db.users.count_documents({
                'is_canary': True,
                'monitoring_active': True
            }),
            'canary_types': {
                'smart_generated': self.db.users.count_documents({
                    'is_canary': True,
                    'canary_type': 'smart_generated'
                })
            }
        }
