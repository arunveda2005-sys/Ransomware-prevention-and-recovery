import json
import os
import threading
from datetime import datetime

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None
    ClientError = Exception


class BackupManager:
    """Secure Offline Enclave for Ransomware Recovery.

    Storage hierarchy (most durable first):
      1. AWS S3  — AES-256 encrypted, immutable off-site (survives server restarts)
      2. In-memory enclave — fast fallback for the current process lifetime

    All operations are non-blocking: S3 uploads run on background threads.
    S3 restores are synchronous to guarantee data integrity before returning.
    """

    # Minimum records required to consider a snapshot non-empty
    _MIN_RECORDS_FOR_VALID_SNAPSHOT = 1

    def __init__(self, db):
        self.db = db
        self.secure_enclave = {}   # { snapshot_id: backup_data }

        # ── S3 Configuration ──────────────────────────────────────────────
        self.s3_bucket = os.getenv('AWS_S3_BUCKET_NAME')
        self.s3_client = None

        if boto3 and self.s3_bucket and os.getenv('AWS_ACCESS_KEY_ID'):
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                region_name=os.getenv('AWS_REGION', 'us-east-1')
            )
            print(f"🛡️  S3 Backup Integration ENABLED — bucket: {self.s3_bucket}")
        else:
            print("⚠️  S3 not configured — backups stored in-memory only (lost on restart).")

    # ── Private helpers ────────────────────────────────────────────────────

    def _upload_to_s3(self, snapshot_id: str, data: dict):
        """Upload a snapshot to AWS S3 (called on a background thread)."""
        if not self.s3_client:
            return
        try:
            self.s3_client.put_object(
                Bucket=self.s3_bucket,
                Key=f"ransomware_backups/{snapshot_id}.json",
                Body=json.dumps(data),
                ContentType='application/json',
                ServerSideEncryption='AES256'
            )
            print(f"✅ S3 mirror complete: s3://{self.s3_bucket}/ransomware_backups/{snapshot_id}.json")
        except Exception as e:
            print(f"⚠️  S3 upload failed for {snapshot_id}: {e}")

    def _fetch_from_s3(self, snapshot_id: str) -> dict | None:
        """Download and parse a snapshot from S3. Returns None on failure."""
        if not self.s3_client:
            return None
        try:
            key = f"ransomware_backups/{snapshot_id}.json"
            response = self.s3_client.get_object(Bucket=self.s3_bucket, Key=key)
            raw = response['Body'].read().decode('utf-8')
            data = json.loads(raw)
            # Cache locally so subsequent calls are instant
            self.secure_enclave[snapshot_id] = data
            print(f"☁️  Loaded {snapshot_id} from S3 into local enclave.")
            return data
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None  # Snapshot simply doesn't exist in S3
            print(f"⚠️  S3 fetch error for {snapshot_id}: {e}")
            return None
        except Exception as e:
            print(f"⚠️  S3 fetch error for {snapshot_id}: {e}")
            return None

    def _list_s3_backups(self) -> list[dict]:
        """List all snapshots stored in S3 (paginated). Returns [] on error."""
        if not self.s3_client:
            return []
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.s3_bucket, Prefix="ransomware_backups/")
            results = []
            for page in pages:
                for obj in page.get('Contents', []):
                    key = obj['Key']  # e.g. ransomware_backups/backup_20260412_195334.json
                    snapshot_id = key.split('/')[-1].replace('.json', '')
                    results.append({
                        'id': snapshot_id,
                        'timestamp': obj['LastModified'].isoformat(),
                        'size_bytes': obj['Size'],
                        'source': 's3'
                    })
            return results
        except Exception as e:
            print(f"⚠️  Could not list S3 backups: {e}")
            return []

    # ── Public API ─────────────────────────────────────────────────────────

    def create_snapshot(self):
        """Take a snapshot of critical collections.

        SAFETY GUARD: Refuses to snapshot an empty database.
        This prevents the ransomware demo from overwriting the real backup
        with a blank snapshot (the wipe must happen AFTER create_snapshot).

        Returns:
            (snapshot_id, users_count, products_count)

        Raises:
            RuntimeError: If the database is currently empty (post-wipe).
        """
        users = list(self.db.users.find({}, {'_id': 0}))
        products = list(self.db.products.find({}, {'_id': 0}))

        total = len(users) + len(products)
        if total < self._MIN_RECORDS_FOR_VALID_SNAPSHOT:
            raise RuntimeError(
                "Snapshot aborted — database is empty. "
                "This prevents storing a blank recovery point."
            )

        snapshot_id = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_data = {
            'snapshot_id': snapshot_id,
            'timestamp': datetime.now().isoformat(),
            'users': users,
            'products': products,
        }

        # 1. Save to in-memory enclave immediately (fast, synchronous)
        self.secure_enclave[snapshot_id] = backup_data

        # 2. Mirror to S3 asynchronously (non-blocking)
        if self.s3_client:
            t = threading.Thread(
                target=self._upload_to_s3,
                args=(snapshot_id, backup_data),
                daemon=True
            )
            t.start()

        print(
            f"🔒 Snapshot created: {snapshot_id} "
            f"({len(users)} users, {len(products)} products)"
        )
        return snapshot_id, len(users), len(products)

    def restore_snapshot(self, snapshot_id: str) -> bool:
        """Restore database from the most durable available source.

        Lookup order:
          1. In-memory enclave (fastest)
          2. AWS S3 (survives server restarts)

        Returns True on success, False if snapshot not found anywhere.
        """
        # 1. Check in-memory first
        backup = self.secure_enclave.get(snapshot_id)

        # 2. Fall back to S3
        if backup is None:
            print(f"🔍 Snapshot {snapshot_id} not in memory — fetching from S3…")
            backup = self._fetch_from_s3(snapshot_id)

        if backup is None:
            print(f"❌ Snapshot {snapshot_id} not found in enclave or S3.")
            return False

        # Validate the snapshot has actual data before nuking the live DB
        user_count = len(backup.get('users', []))
        product_count = len(backup.get('products', []))
        if user_count + product_count < self._MIN_RECORDS_FOR_VALID_SNAPSHOT:
            print(f"❌ Snapshot {snapshot_id} is empty — restore aborted to prevent data loss.")
            return False

        # Wipe infected / encrypted data
        self.db.users.delete_many({})
        self.db.products.delete_many({})

        # Restore clean data
        if backup['users']:
            self.db.users.insert_many(backup['users'])
        if backup['products']:
            self.db.products.insert_many(backup['products'])

        print(
            f"✅ Database restored from {snapshot_id}: "
            f"{user_count} users, {product_count} products."
        )
        return True

    def list_backups(self) -> list[dict]:
        """Return all available snapshots, merging in-memory + S3 sources.

        Deduplicates by snapshot_id (in-memory wins for metadata freshness).
        Sorted newest-first by timestamp.
        """
        # Start with what S3 knows about (most complete view after restarts)
        s3_backups = {b['id']: b for b in self._list_s3_backups()}

        # Overlay with in-memory entries (same session data is authoritative)
        memory_backups = {
            k: {
                'id': k,
                'timestamp': v['timestamp'],
                'source': 'memory+s3' if k in s3_backups else 'memory',
                'users': len(v.get('users', [])),
                'products': len(v.get('products', [])),
            }
            for k, v in self.secure_enclave.items()
        }

        # Merge: memory entries override S3 entries for the same id
        merged = {**s3_backups, **memory_backups}

        # Sort newest first
        return sorted(merged.values(), key=lambda x: x['timestamp'], reverse=True)
