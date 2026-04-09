import json
import os
from datetime import datetime

class BackupManager:
    """Simulated Secure Offline Enclave for Ransomware Recovery"""
    
    def __init__(self, db):
        self.db = db
        # We store backups in memory for the demo, but in real life this goes to immutable cloud storage
        self.secure_enclave = {}

    def create_snapshot(self):
        """Take a snapshot of critical collections"""
        snapshot_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Pull real data
        users = list(self.db.users.find({}, {'_id': 0}))
        products = list(self.db.products.find({}, {'_id': 0}))
        
        self.secure_enclave[snapshot_id] = {
            'timestamp': datetime.now().isoformat(),
            'users': users,
            'products': products
        }
        return snapshot_id, len(users), len(products)

    def restore_snapshot(self, snapshot_id):
        """Restore database from secure enclave"""
        if snapshot_id not in self.secure_enclave:
            return False
            
        backup = self.secure_enclave[snapshot_id]
        
        # Wipe infected/deleted data
        self.db.users.delete_many({})
        self.db.products.delete_many({})
        
        # Restore pure data
        if backup['users']:
            self.db.users.insert_many(backup['users'])
        if backup['products']:
            self.db.products.insert_many(backup['products'])
            
        return True
    
    def list_backups(self):
        """Get all available snapshots"""
        return [{'id': k, 'timestamp': v['timestamp']} for k, v in self.secure_enclave.items()]
