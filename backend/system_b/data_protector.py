from cryptography.fernet import Fernet
import base64
import hashlib
import os

class DataProtector:
    """
    Advanced data protection with encryption and differential privacy
    """
    
    def __init__(self, master_key: str = None):
        # Generate or use provided master key
        if master_key:
            # Ensure key is proper length for Fernet (32 bytes base64 encoded)
            key_bytes = master_key.encode()[:32].ljust(32, b'!')
            self.master_key = base64.urlsafe_b64encode(key_bytes)
        else:
            self.master_key = Fernet.generate_key()
        
        self.cipher = Fernet(self.master_key)
        
        # Sensitivity levels
        self.sensitivity_map = {
            'email': 'SENSITIVE',
            'phone': 'SENSITIVE',
            'address': 'SENSITIVE',
            'password': 'CRITICAL',
            'ssn': 'CRITICAL',
            'credit_card': 'CRITICAL',
            'name': 'LOW',
            'city': 'LOW'
        }
    
    def classify_field(self, field_name: str) -> str:
        """Classify data field by sensitivity"""
        field_lower = field_name.lower()
        
        for keyword, level in self.sensitivity_map.items():
            if keyword in field_lower:
                return level
        
        return 'LOW'
    
    def encrypt_field(self, value: str) -> str:
        """Encrypt sensitive field value"""
        if not value:
            return value
        
        encrypted = self.cipher.encrypt(str(value).encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_field(self, encrypted_value: str) -> str:
        """Decrypt field value"""
        if not encrypted_value:
            return encrypted_value
        
        try:
            decoded = base64.b64decode(encrypted_value.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except:
            return encrypted_value  # Already decrypted or invalid
    
    def hash_for_lookup(self, value: str) -> str:
        """Create searchable hash of value"""
        return hashlib.sha256(str(value).encode()).hexdigest()
    
    def add_differential_privacy_noise(self, value: float, epsilon: float = 1.0) -> float:
        """Add Laplace noise for differential privacy"""
        import numpy as np
        
        # Laplace mechanism
        scale = 1.0 / epsilon
        noise = np.random.laplace(0, scale)
        
        return value + noise
    
    def protect_user_data(self, user_data: dict) -> dict:
        """Apply protection to user data based on sensitivity"""
        protected = user_data.copy()
        
        for field, value in user_data.items():
            if not value or field == '_id' or field.startswith('is_'):
                continue
            
            sensitivity = self.classify_field(field)
            
            if sensitivity == 'CRITICAL':
                # Encrypt critical data
                protected[field] = self.encrypt_field(str(value))
                protected[f'{field}_hash'] = self.hash_for_lookup(str(value))
            
            elif sensitivity == 'SENSITIVE':
                # Encrypt sensitive data
                protected[field] = self.encrypt_field(str(value))
        
        return protected
