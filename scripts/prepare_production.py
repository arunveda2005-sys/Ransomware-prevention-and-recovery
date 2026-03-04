#!/usr/bin/env python3
"""
Production Preparation Script
Automatically updates code from demo/development to production-ready
"""

import os
import shutil
from datetime import datetime

def backup_file(filepath):
    """Create backup before modifying"""
    backup_path = f"{filepath}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(filepath, backup_path)
    print(f"  📦 Backup created: {backup_path}")
    return backup_path

def update_app_py():
    """Update app.py for production IP detection"""
    
    filepath = 'backend/app.py'
    print(f"\n[1/3] Updating {filepath}...")
    
    # Backup first
    backup_file(filepath)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add get_client_ip function
    ip_function = '''
def get_client_ip(request):
    """
    Get real client IP from reverse proxy headers
    Works with Vercel, Render, and other cloud platforms
    """
    # Check X-Forwarded-For (standard for reverse proxies)
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        # Take first IP (original client)
        return forwarded.split(',')[0].strip()
    
    # Check X-Real-IP (alternative header)
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    return request.remote_addr

'''
    
    # Insert function before middleware
    if 'def get_client_ip(' not in content:
        content = content.replace(
            '# ==================== MIDDLEWARE ====================',
            ip_function + '# ==================== MIDDLEWARE ===================='
        )
        print("  ✅ Added get_client_ip() function")
    else:
        print("  ℹ️  get_client_ip() already exists")
    
    # Replace X-Mock-IP with get_client_ip (Line 76)
    if "request.headers.get('X-Mock-IP', request.remote_addr)" in content:
        content = content.replace(
            "client_ip = request.headers.get('X-Mock-IP', request.remote_addr)",
            "client_ip = get_client_ip(request)  # Production: Use real IP"
        )
        print("  ✅ Replaced X-Mock-IP with get_client_ip() [Line 76]")
    
    # Replace X-Mock-IP in export endpoint (Line 731)
    content = content.replace(
        "'ip_address': request.headers.get('X-Mock-IP', request.remote_addr)",
        "'ip_address': get_client_ip(request)  # Production: Use real IP"
    )
    print("  ✅ Updated export endpoint IP detection")
    
    # Update whitelist (remove /export for production)
    if "'/api/admin/users/export'," in content and "# ⭐ MUST allow for System B demo" in content:
        content = content.replace(
            "'/api/admin/users/export',      # ⭐ MUST allow for System B demo",
            "# '/api/admin/users/export',    # ❌ Disabled for production (System A will block)"
        )
        print("  ✅ Disabled /export endpoint from whitelist (System A will block exfiltration)")
    
    # Remove X-Mock-IP from CORS headers
    if '"X-Mock-IP"' in content:
        content = content.replace(
            '"allow_headers": ["Content-Type", "Authorization", "X-Mock-IP", "Session-ID"]',
            '"allow_headers": ["Content-Type", "Authorization", "Session-ID"]'
        )
        print("  ✅ Removed X-Mock-IP from CORS headers")
    
    # Write updated content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ {filepath} updated for production")

def update_honeytoken_generator():
    """Update honeytoken_generator.py for production IP detection"""
    
    filepath = 'backend/system_b/honeytoken_generator.py'
    print(f"\n[2/3] Updating {filepath}...")
    
    # Backup first
    backup_file(filepath)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace X-Mock-IP logic
    if "request_context.headers.get('X-Mock-IP'," in content:
        old_code = """            attacker_ip = request_context.headers.get('X-Forwarded-For', 
                                                      request_context.headers.get('X-Mock-IP',
                                                                                  request_context.remote_addr))"""
        
        new_code = """            # Get real IP from reverse proxy
            forwarded = request_context.headers.get('X-Forwarded-For')
            if forwarded:
                attacker_ip = forwarded.split(',')[0].strip()
            else:
                attacker_ip = request_context.headers.get('X-Real-IP', request_context.remote_addr)"""
        
        content = content.replace(old_code, new_code)
        print("  ✅ Updated IP detection for production")
    
    # Write updated content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✅ {filepath} updated for production")

def create_production_env_template():
    """Create production .env template"""
    
    filepath = 'backend/.env.production'
    print(f"\n[3/3] Creating {filepath}...")
    
    env_template = """# Production Environment Variables
# Copy these to your Render/Railway dashboard

# MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-CHANGE-THIS
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key-CHANGE-THIS!!

# Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-flask-secret-key-CHANGE-THIS

# CORS (Add your Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app,https://your-backend.onrender.com

# Blockchain
BLOCKCHAIN_DIFFICULTY=4
BLOCKCHAIN_MINING_INTERVAL=60

# Port (Railway/Render auto-set this)
PORT=5000
"""
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(env_template)
    
    print(f"  ✅ Created {filepath}")

def verify_changes():
    """Verify all changes were applied"""
    
    print("\n" + "="*70)
    print("VERIFICATION")
    print("="*70)
    
    with open('backend/app.py', 'r', encoding='utf-8') as f:
        app_content = f.read()
    
    checks = [
        ('get_client_ip function exists', 'def get_client_ip(' in app_content),
        ('X-Mock-IP removed from Line 76', "client_ip = get_client_ip(request)" in app_content),
        ('/export removed from whitelist', "# '/api/admin/users/export'" in app_content),
        ('X-Mock-IP removed from CORS', '"X-Mock-IP"' not in app_content or '"Session-ID"]' in app_content)
    ]
    
    all_passed = True
    for check_name, result in checks:
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
        if not result:
            all_passed = False
    
    return all_passed

def main():
    """Main execution"""
    
    print("="*70)
    print("PRODUCTION PREPARATION SCRIPT")
    print("="*70)
    print("\nThis script will:")
    print("  1. Update app.py for real IP detection (remove X-Mock-IP)")
    print("  2. Update honeytoken_generator.py for production")
    print("  3. Create .env.production template")
    print("\nBackups will be created automatically.")
    print("="*70)
    
    # Check we're in the right directory
    if not os.path.exists('backend/app.py'):
        print("\n❌ ERROR: Run this script from the project root directory!")
        print("   Current directory:", os.getcwd())
        return 1
    
    try:
        # Apply updates
        update_app_py()
        update_honeytoken_generator()
        create_production_env_template()
        
        # Verify
        if verify_changes():
            print("\n" + "="*70)
            print("✅ PRODUCTION PREPARATION COMPLETE!")
            print("="*70)
            print("\nNext steps:")
            print("  1. Review changes in backend/app.py")
            print("  2. Update frontend/.env.production with your Vercel/Render URLs")
            print("  3. Set environment variables in Render dashboard (use .env.production)")
            print("  4. Upload ML models to Render persistent storage")
            print("  5. Deploy!")
            print("\n📚 See PRODUCTION_AUDIT.md for detailed deployment guide")
            return 0
        else:
            print("\n⚠️  WARNING: Some verification checks failed!")
            print("   Please review the changes manually.")
            return 1
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
