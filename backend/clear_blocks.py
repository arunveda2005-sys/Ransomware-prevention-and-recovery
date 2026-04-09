import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config.db import get_database

db = get_database()
count = db.blocked_ips.count_documents({})
print(f"Found {count} blocked IPs. Deleting them...")
db.blocked_ips.delete_many({})
db.request_logs.delete_many({}) # Might as well clear these too
print("Cleared!")
