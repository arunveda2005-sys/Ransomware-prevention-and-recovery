from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

_client = None
_db = None

def get_database():
    """Get MongoDB database connection"""
    global _client, _db
    
    if _db is None:
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            raise ValueError("MONGODB_URI not set in environment variables")
        
        try:
            _client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            # Trigger connection to verify
            _client.admin.command('ping')
            _db = _client['ecommerce_defense']
            print(f"✓ Connected to MongoDB Atlas: {_db.name}")
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {str(e)}")
            raise e
        
        # Create indexes
        _create_indexes(_db)
    
    return _db

def _create_indexes(db):
    """Create database indexes for performance"""
    
    # Users
    db.users.create_index('email', unique=True)
    db.users.create_index('is_canary')
    
    # Products
    db.products.create_index('name')
    db.products.create_index('category')
    
    # Request logs
    db.request_logs.create_index('timestamp')
    db.request_logs.create_index('session_id')
    db.request_logs.create_index('user_id')
    
    # Blockchain
    db.blockchain_blocks.create_index('index', unique=True)
    
    print("✓ Database indexes created")
