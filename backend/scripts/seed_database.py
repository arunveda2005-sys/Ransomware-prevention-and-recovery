import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.db import get_database
from datetime import datetime
import bcrypt

def seed_database():
    """Seed initial data"""
    db = get_database()
    
    # Clear existing data (development only)
    print("Clearing existing data...")
    db.users.delete_many({})
    db.products.delete_many({})
    db.orders.delete_many({})
    db.request_logs.delete_many({}) # Clear threat logs
    db.carts.delete_many({})
    db.blocked_ips.delete_many({}) # Clear active IP bans
    
    # Create admin user
    print("Creating admin user...")
    admin_password = bcrypt.hashpw('admin123'.encode(), bcrypt.gensalt()).decode()
    
    db.users.insert_one({
        'email': 'admin@ecommerce.com',
        'password': admin_password,
        'name': 'Admin User',
        'role': 'admin',
        'created_at': datetime.now().isoformat(),
        'is_canary': False
    })
    
    # Create normal user
    user_password = bcrypt.hashpw('user123'.encode(), bcrypt.gensalt()).decode()
    
    db.users.insert_one({
        'email': 'user@example.com',
        'password': user_password,
        'name': 'Test User',
        'role': 'user',
        'created_at': datetime.now().isoformat(),
        'is_canary': False
    })
    
    # Create attacker user (for testing)
    attacker_password = bcrypt.hashpw('attacker123'.encode(), bcrypt.gensalt()).decode()
    
    db.users.insert_one({
        'email': 'attacker@example.com',
        'password': attacker_password,
        'name': 'Attacker Test',
        'role': 'attacker',
        'created_at': datetime.now().isoformat(),
        'is_canary': False
    })
    
    # Create sample products
    print("Creating sample products...")
    products = [
        {
            'name': 'Laptop Pro 15',
            'description': 'High-performance laptop with 16GB RAM and 512GB SSD',
            'price': 1299.99,
            'category': 'Electronics',
            'stock': 50,
            'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Wireless Mouse',
            'description': 'Ergonomic wireless mouse with precision tracking',
            'price': 29.99,
            'category': 'Accessories',
            'stock': 200,
            'image_url': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'USB-C Hub',
            'description': '7-in-1 USB-C adapter with HDMI, USB 3.0, and SD card reader',
            'price': 49.99,
            'category': 'Accessories',
            'stock': 100,
            'image_url': 'https://images.unsplash.com/photo-1596752002360-1e58284d7d13?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Mechanical Keyboard',
            'description': 'RGB mechanical gaming keyboard with Cherry MX switches',
            'price': 149.99,
            'category': 'Electronics',
            'stock': 75,
            'image_url': 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': '27" 4K Monitor',
            'description': 'Ultra HD 4K monitor with HDR support',
            'price': 399.99,
            'category': 'Electronics',
            'stock': 30,
            'image_url': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Noise Cancelling Headphones',
            'description': 'Premium over-ear headphones with active noise cancellation',
            'price': 249.99,
            'category': 'Electronics',
            'stock': 150,
            'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
            'created_at': datetime.now().isoformat()
        }
    ]
    
    db.products.insert_many(products)
    
    print("✅ Database seeded successfully!")
    print("\nLogin credentials:")
    print("  Admin: admin@ecommerce.com / admin123")
    print("  User: user@example.com / user123")
    print("  Attacker: attacker@example.com / attacker123")

if __name__ == '__main__':
    seed_database()
