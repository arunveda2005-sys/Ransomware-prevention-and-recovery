import hashlib
import json
from datetime import datetime
from typing import Dict, Any

class Block:
    """
    Immutable block for audit trail
    Each block contains attack/threat events
    """
    
    def __init__(
        self,
        index: int,
        timestamp: str,
        data: Dict[Any, Any],
        previous_hash: str
    ):
        self.index = index
        self.timestamp = timestamp
        self.data = data
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of block"""
        block_string = json.dumps({
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }, sort_keys=True)
        
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int):
        """
        Proof of Work mining
        Find nonce such that hash starts with 'difficulty' zeros
        """
        target = '0' * difficulty
        
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
    
    def to_dict(self) -> Dict:
        """Convert block to dictionary"""
        return {
            'index': self.index,
            'timestamp': self.timestamp,
            'data': self.data,
            'previous_hash': self.previous_hash,
            'nonce': self.nonce,
            'hash': self.hash
        }
