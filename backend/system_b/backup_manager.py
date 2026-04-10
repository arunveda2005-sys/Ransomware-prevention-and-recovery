import json
import os
import threading
from datetime import datetime

try:
    import boto3
except ImportError:
    boto3 = None

class BackupManager:
    """Simulated Secure Offline Enclave for Ransomware Recovery"""
    
    def __init__(self, db):
        self.db = db
        # We store backups in memory for the demo, but in real life this goes to immutable cloud storage
        self.secure_enclave = {}
        
        # S3 Configuration
        self.s3_bucket = os.getenv('AWS_S3_BUCKET_NAME')
        self.s3_client = None
        if boto3 and self.s3_bucket and os.getenv('AWS_ACCESS_KEY_ID'):
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
            print(f"🛡️ S3 Backup Integration Enabled for bucket: {self.s3_bucket}")

    def _upload_to_s3(self, snapshot_id, data):
        """Upload the snapshot to AWS S3 in the background"""
        if not self.s3_client:
            return
            
        try:
            json_data = json.dumps(data)
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=f"ransomware_backups/{snapshot_id}.json",
                Body=json_data,
                ContentType='application/json',
                ServerSideEncryption='AES256'
            )
            print(f"\n✅ Backup {snapshot_id} successfully mirrored to AWS S3 Bucket: {self.s3_bucket}")
        except Exception as e:
            print(f"\n⚠️ Failed to upload backup to S3: {e}")

    def create_snapshot(self):
        """Take a snapshot of critical collections"""
        snapshot_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Pull real data
        users = list(self.db.users.find({}, {'_id': 0}))
        products = list(self.db.products.find({}, {'_id': 0}))
        
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'users': users,
            'products': products
        }
        
        self.secure_enclave[snapshot_id] = backup_data
        
        # Map to AWS S3 asynchronously so it doesn't block the request
        if self.s3_client:
            threading.Thread(target=self._upload_to_s3, args=(snapshot_id, backup_data)).start()
            
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
