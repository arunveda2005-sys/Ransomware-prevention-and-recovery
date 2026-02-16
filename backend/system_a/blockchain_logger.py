from blockchain.chain import Blockchain
from datetime import datetime
import threading
import time

class BlockchainLogger:
    """
    Manages blockchain logging for security events
    Automatically mines blocks at intervals
    """
    
    def __init__(self, difficulty: int = 4, mining_interval: int = 60):
        self.blockchain = Blockchain(difficulty=difficulty)
        self.mining_interval = mining_interval  # seconds
        self.running = False
        self.mining_thread = None
    
    def log_threat_event(self, threat_data: dict):
        """Log a threat detection event to blockchain"""
        event = {
            'session_id': threat_data.get('session_id'),
            'timestamp': threat_data.get('timestamp', datetime.now().isoformat()),
            'risk_score': threat_data.get('risk_score'),
            'action': threat_data.get('action'),
            'reasoning': threat_data.get('reasoning'),
            'model_votes': threat_data.get('model_votes', {}),
            'confidence': threat_data.get('confidence')
        }
        
        self.blockchain.add_threat_event(event)
        
        # Auto-mine if threshold reached
        if len(self.blockchain.pending_data) >= 10:
            self.mine_block()
    
    def mine_block(self):
        """Mine pending events into a new block"""
        return self.blockchain.mine_pending_block()
    
    def start_auto_mining(self):
        """Start automatic periodic mining"""
        self.running = True
        self.mining_thread = threading.Thread(target=self._auto_mine_loop, daemon=True)
        self.mining_thread.start()
    
    def stop_auto_mining(self):
        """Stop automatic mining"""
        self.running = False
        if self.mining_thread:
            self.mining_thread.join()
    
    def _auto_mine_loop(self):
        """Background thread for periodic mining"""
        while self.running:
            time.sleep(self.mining_interval)
            if self.blockchain.pending_data:
                print(f"⛏️  Auto-mining block with {len(self.blockchain.pending_data)} events...")
                block = self.mine_block()
                if block:
                    print(f"✓ Block #{block.index} mined: {block.hash[:16]}...")
    
    def verify_integrity(self) -> bool:
        """Verify blockchain hasn't been tampered with"""
        return self.blockchain.is_chain_valid()
    
    def get_session_history(self, session_id: str):
        """Get complete audit trail for a session"""
        return self.blockchain.get_events_for_session(session_id)
    
    def get_statistics(self):
        """Get blockchain stats"""
        return self.blockchain.get_statistics()
    
    def export_blockchain(self):
        """Export entire blockchain for external verification"""
        return self.blockchain.export_chain()
