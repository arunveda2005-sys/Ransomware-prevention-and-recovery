from typing import List, Dict, Any
from datetime import datetime
from blockchain.block import Block
import json

class Blockchain:
    """
    Immutable audit log for security events
    Tamper-proof record of all threat detections
    """
    
    def __init__(self, difficulty: int = 4):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_data: List[Dict] = []
        
        # Create genesis block
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block"""
        genesis_block = Block(
            index=0,
            timestamp=datetime.now().isoformat(),
            data={'message': 'Genesis Block - E-commerce Defense System'},
            previous_hash='0'
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Block:
        """Get the most recent block"""
        return self.chain[-1]
    
    def add_threat_event(self, event_data: Dict[Any, Any]):
        """Add threat detection event to pending transactions"""
        self.pending_data.append(event_data)
    
    def mine_pending_block(self):
        """Mine a new block with all pending threat events"""
        if not self.pending_data:
            return None
        
        new_block = Block(
            index=len(self.chain),
            timestamp=datetime.now().isoformat(),
            data={
                'events': self.pending_data,
                'count': len(self.pending_data)
            },
            previous_hash=self.get_latest_block().hash
        )
        
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        
        # Clear pending data
        mined_data = self.pending_data.copy()
        self.pending_data = []
        
        return new_block
    
    def is_chain_valid(self) -> bool:
        """Verify blockchain integrity"""
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Verify current block hash
            if current_block.hash != current_block.calculate_hash():
                return False
            
            # Verify link to previous block
            if current_block.previous_hash != previous_block.hash:
                return False
            
            # Verify proof of work
            if not current_block.hash.startswith('0' * self.difficulty):
                return False
        
        return True
    
    def get_events_for_session(self, session_id: str) -> List[Dict]:
        """Get all events for a specific session"""
        events = []
        
        for block in self.chain[1:]:  # Skip genesis
            block_events = block.data.get('events', [])
            for event in block_events:
                if event.get('session_id') == session_id:
                    events.append({
                        'block_index': block.index,
                        'block_hash': block.hash,
                        'event': event
                    })
        
        return events
    
    def export_chain(self) -> List[Dict]:
        """Export entire blockchain"""
        return [block.to_dict() for block in self.chain]
    
    def get_statistics(self) -> Dict:
        """Get blockchain statistics"""
        total_events = sum(
            len(block.data.get('events', [])) 
            for block in self.chain[1:]
        )
        
        return {
            'total_blocks': len(self.chain),
            'total_events': total_events,
            'difficulty': self.difficulty,
            'is_valid': self.is_chain_valid(),
            'latest_block_hash': self.get_latest_block().hash,
            'pending_events': len(self.pending_data)
        }
