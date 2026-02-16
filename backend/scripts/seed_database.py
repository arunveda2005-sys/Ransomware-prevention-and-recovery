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
            'image_url': 'https://via.placeholder.com/300?text=Laptop',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Wireless Mouse',
            'description': 'Ergonomic wireless mouse with precision tracking',
            'price': 29.99,
            'category': 'Accessories',
            'stock': 200,
            'image_url': 'https://via.placeholder.com/300?text=Mouse',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'USB-C Hub',
            'description': '7-in-1 USB-C adapter with HDMI, USB 3.0, and SD card reader',
            'price': 49.99,
            'category': 'Accessories',
            'stock': 100,
            'image_url': 'https://via.placeholder.com/300?text=Hub',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Mechanical Keyboard',
            'description': 'RGB mechanical gaming keyboard with Cherry MX switches',
            'price': 149.99,
            'category': 'Electronics',
            'stock': 75,
            'image_url': 'https://via.placeholder.com/300?text=Keyboard',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': '27" 4K Monitor',
            'description': 'Ultra HD 4K monitor with HDR support',
            'price': 399.99,
            'category': 'Electronics',
            'stock': 30,
            'image_url': 'https://via.placeholder.com/300?text=Monitor',
            'created_at': datetime.now().isoformat()
        },
        {
            'name': 'Webcam HD',
            'description': '1080p HD webcam with built-in microphone',
            'price': 79.99,
            'category': 'Electronics',
            'stock': 120,
            'image_url': 'https://via.placeholder.com/300?text=Webcam',
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
