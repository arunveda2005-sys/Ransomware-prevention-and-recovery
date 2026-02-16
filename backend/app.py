from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import sys
import time
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
from bson import ObjectId

# Add parent directory to path for blockchain module
# (Handled by run.py now)

# Load environment variables
load_dotenv()

# Initialize Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
if not app.config['SECRET_KEY']:
    print("WARNING: SECRET_KEY not set in environment. Using insecure default for development only.")
    app.config['SECRET_KEY'] = 'dev-secret-key'

# CORS for Vercel frontend
CORS(app, resources={
    r"/*": {
        "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','),
        "allow_headers": ["Content-Type", "Authorization", "X-Mock-IP", "Session-ID"]
    }
})

# WebSocket (using threading mode for Python 3.13 compatibility)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Database connection
from config.db import get_database
db = get_database()

# Import systems
from system_a.agentic_detector import AgenticThreatDetector
from system_a.blockchain_logger import BlockchainLogger
from system_b.smart_canaries import SmartCanaryGenerator
from system_b.data_protector import DataProtector
from system_b.breach_calculator import BreachImpactCalculator

# Initialize systems
threat_detector = AgenticThreatDetector()
blockchain_logger = BlockchainLogger(difficulty=4, mining_interval=60)
blockchain_logger.start_auto_mining()

canary_generator = SmartCanaryGenerator(db)
data_protector = DataProtector(master_key=os.getenv('ENCRYPTION_KEY'))
breach_calculator = BreachImpactCalculator(db)

# ==================== MIDDLEWARE ====================

# Global Banned IPs (In-memory for demo purposes)
BANNED_IPS = set()

@app.before_request
def log_request():
    """Request interceptor - System A monitoring"""
    # Skip for OPTIONS requests
    if request.method == 'OPTIONS':
        return

    # Determine Client IP (Demo Spoofing Support)
    client_ip = request.headers.get('X-Mock-IP', request.remote_addr)
    # print(f"DEBUG: Endpoint: {request.path} | Resolved IP: {client_ip}") # Uncomment for deeper debugging

    # Check IP Ban (Manual Blocks)
    if client_ip in BANNED_IPS:
        # ALLOW LOGIN and UNBAN endpoints for demo recovery
        if request.path not in ['/api/auth/login', '/api/admin/ip/unban']:
             return jsonify({'error': 'Access Denied - IP Banned'}), 403
    
    # Check Session Risk (Smart Blocking)
    session_id = request.headers.get('Session-ID', 'unknown')
    if session_id != 'unknown':
        status = threat_detector.get_session_status(session_id)
        if status == 'block':
            # Whitelist Admin & Auth endpoints to prevent lockout
            # ALSO whitelist the Exfiltration Target so System B can be triggered! (Demo Logic)
            if request.path.startswith('/api/admin') or request.path.startswith('/api/auth'):
                # Special check: If it's the Exfiltration endpoint, we MUST let it through
                # so the Canary/Blockchain logic (System B) can catch it.
                if request.path == '/api/admin/users/export':
                    pass
                pass  # Allow admin to proceed even if flagged
            else:
                # Log the block attempt?
                print(f"⛔ Pre-emptive block for session {session_id}")
                return jsonify({'error': 'Access Denied - High Risk Detected'}), 403
    
    # Skip for static files
    if request.path.startswith('/static'):
        return
    
    # Extract request data
    request_data = {
        'endpoint': request.path,
        'method': request.method,
        'ip': client_ip, # Use the determined IP
        'user_agent': request.headers.get('User-Agent'),
        'timestamp': datetime.now().isoformat(),
        'request_size': len(request.get_data()),
        'session_id': request.headers.get('Session-ID', 'unknown')
    }
    
    # Store for after_request
    request.start_time = datetime.now()
    request.request_data = request_data

@app.after_request
def analyze_request(response):
    """Response interceptor - System A analysis"""
    if not hasattr(request, 'request_data'):
        return response
    
    # Calculate response time
    response_time = (datetime.now() - request.start_time).total_seconds() * 1000
    
    # Complete request data
    request_data = request.request_data
    request_data.update({
        'response_size': len(response.get_data()),
        'response_time': response_time,
        'status_code': response.status_code
    })
    
    # Get user info if available
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request_data['user_id'] = payload.get('user_id')
            request_data['role'] = payload.get('role')
        except:
            pass
    
    # System A: Analyze threat
    session_id = request_data.get('session_id', 'unknown')
    
    # Whitelist Admin & Auth endpoints from Analysis (Don't profile the admin!)
    # EXCEPT for the Exfiltration Demo endpoint - it needs to be analyzed
    # IMPORTANT: Skip ML processing entirely, not just override the result
    if (request.path.startswith('/api/admin') or request.path.startswith('/api/auth')) and request.path != '/api/admin/users/export':
        threat_analysis = {
            'action': 'allow',
            'risk_score': 0.0,
            'reasoning': 'Trusted Admin/Auth Request',
            'model_votes': {}
        }
        # MUST update request_data so it's logged correctly to DB
        request_data.update(threat_analysis)
        # SKIP the ML detector entirely - don't pollute session memory
    else:
        try:
            # Only analyze non-admin requests OR the exfiltration endpoint
            threat_analysis = threat_detector.analyze_request(request_data, session_id)
            print(f"DEBUG: Threat Analysis Result: {threat_analysis}")
            
            # Update request data with analysis results
            # SPECIAL CASE: For Exfiltration Demo, System A should NOT claim to 'block' this 
            # if we intentionally let it through. Force it to 'monitor'.
            if request.path == '/api/admin/users/export':
                threat_analysis['action'] = 'monitor'
                threat_analysis['reasoning'] = 'System A Bypassed -> Triggering System B'
            
            request_data.update({
                'risk_score': threat_analysis.get('risk_score', 0),
                'action': threat_analysis.get('action', 'allow'),
                'reasoning': threat_analysis.get('reasoning', ''),
                'model_votes': threat_analysis.get('model_votes', {})
            })
        except Exception as e:
            print(f"ERROR: Threat analysis failed: {e}")
            # Ensure we still log the request even if analysis fails
            request_data.update({
                'risk_score': 0,
                'action': 'error',
                'reasoning': f"Analysis failed: {str(e)}"
            })
            threat_analysis = {'action': 'allow', 'risk_score': 0}

    # Log to database (NOW containing threat data)
    db.request_logs.insert_one(request_data)
    
    # Log to blockchain if threat detected
    if threat_analysis['risk_score'] > 0.5:
        # Enriched analysis with IP for frontend
        frontend_data = {
            **threat_analysis,
            'ip': request_data.get('ip'),
            'path': request_data.get('endpoint'),  # Frontend expects 'path'
            'endpoint': request_data.get('endpoint'),  # Keep for backward compatibility
            'user_agent': request_data.get('user_agent'),
            'timestamp': request_data.get('timestamp')  # Frontend needs timestamp
        }
        blockchain_logger.log_threat_event(frontend_data)
        
        # Send real-time update via WebSocket
        socketio.emit('threat_detected', frontend_data)
    
    # Apply response based on action
    if threat_analysis['action'] == 'block':
        # BANNED_IPS.add(request_data['ip']) # <-- REMOVED: Only manual blocks add to global list
        return jsonify({'error': 'Request blocked due to security concerns'}), 403
    
    elif threat_analysis['action'] == 'shadow_ban':
        response.headers['X-Shadow-Ban'] = 'true'

    elif threat_analysis['action'] == 'throttle':
        # Artificial delay to slow down attackers
        time.sleep(2.0)
    
    return response

# ==================== AUTH DECORATORS ====================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        try:
            token = token.split(' ')[1]
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.current_user = payload
        except:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

# ==================== AUTH ROUTES ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration"""
    data = request.json
    
    # Validate input
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    # Check if user exists
    existing = db.users.find_one({'email': data['email']})
    if existing:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Hash password
    hashed_password = bcrypt.hashpw(
        data['password'].encode(),
        bcrypt.gensalt()
    ).decode()
    
    # Create user
    user = {
        'email': data['email'],
        'password': hashed_password,
        'name': data.get('name', ''),
        'role': 'user',
        'created_at': datetime.now().isoformat(),
        'is_canary': False
    }
    
    result = db.users.insert_one(user)
    
    # Generate JWT
    token = jwt.encode({
        'user_id': str(result.inserted_id),
        'email': user['email'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': str(result.inserted_id),
            'email': user['email'],
            'role': user['role']
        }
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    
    # Find user
    user = db.users.find_one({'email': data.get('email')})
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check password
    if not bcrypt.checkpw(data.get('password', '').encode(), user['password'].encode()):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT
    token = jwt.encode({
        'user_id': str(user['_id']),
        'email': user['email'],
        'role': user['role'],
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    # Clear ML threat history for admin sessions
    # This prevents admins from being blocked due to pre-login activity
    if user['role'] == 'admin':
        session_id = request.headers.get('Session-ID', 'unknown')
        if session_id != 'unknown':
            threat_detector.reset_session(session_id)
            print(f"✓ Cleared threat history for admin session: {session_id}")
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'name': user.get('name', ''),
            'role': user['role']
        }
    })

# ==================== PRODUCT ROUTES ====================

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        page = max(1, int(request.args.get('page', 1)))
        limit = min(100, max(1, int(request.args.get('limit', 20))))  # Cap at 100
    except ValueError:
        return jsonify({'error': 'Invalid pagination parameters'}), 400
    
    search = request.args.get('search', '')
    # Sanitize search input to prevent NoSQL injection
    if search and len(search) > 100:
        return jsonify({'error': 'Search query too long'}), 400
    
    # Build query
    query = {}
    if search:
        query['$or'] = [
            {'name': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    # Get products
    skip = (page - 1) * limit
    products = list(db.products.find(query).skip(skip).limit(limit))
    total = db.products.count_documents(query)
    
    # Convert ObjectId to string
    for product in products:
        product['_id'] = str(product['_id'])
    
    return jsonify({
        'products': products,
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    })

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product"""
    # Validate ObjectId format
    try:
        product = db.products.find_one({'_id': ObjectId(product_id)})
    except Exception:
        return jsonify({'error': 'Invalid product ID'}), 400
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    product['_id'] = str(product['_id'])
    return jsonify(product)

# ==================== CART ROUTES ====================

@app.route('/api/cart', methods=['GET'])
@token_required
def get_cart():
    """Get user's cart"""
    user_id = request.current_user.get('user_id')
    
    cart = db.carts.find_one({'user_id': user_id})
    
    if not cart:
        return jsonify({'items': [], 'total': 0})
    
    # Populate product details
    items = []
    total = 0
    
    for item in cart.get('items', []):
        try:
            product = db.products.find_one({'_id': ObjectId(item['product_id'])})
        except Exception:
            continue  # Skip invalid product IDs
        if product:
            item_total = product['price'] * item['quantity']
            total += item_total
            
            items.append({
                'product_id': str(product['_id']),
                'name': product['name'],
                'price': product['price'],
                'quantity': item['quantity'],
                'subtotal': item_total
            })
    
    return jsonify({
        'items': items,
        'total': total
    })

@app.route('/api/cart/add', methods=['POST'])
@token_required
def add_to_cart():
    """Add item to cart"""
    user_id = request.current_user.get('user_id')
    data = request.json
    
    # Find or create cart
    cart = db.carts.find_one({'user_id': user_id})
    
    if not cart:
        cart = {
            'user_id': user_id,
            'items': [],
            'updated_at': datetime.now().isoformat()
        }
        db.carts.insert_one(cart)
    
    # Add item
    item = {
        'product_id': data['product_id'],
        'quantity': int(data.get('quantity', 1))
    }
    
    # Check if item already in cart
    existing_item = next(
        (i for i in cart['items'] if i['product_id'] == item['product_id']),
        None
    )
    
    if existing_item:
        existing_item['quantity'] += item['quantity']
    else:
        cart['items'].append(item)
    
    # Update cart
    db.carts.update_one(
        {'user_id': user_id},
        {'$set': {'items': cart['items'], 'updated_at': datetime.now().isoformat()}}
    )
    
    return jsonify({'message': 'Item added to cart'})

@app.route('/api/cart/checkout', methods=['POST'])
@token_required
def checkout():
    """Process checkout"""
    user_id = request.current_user.get('user_id')
    
    # Get cart
    cart = db.carts.find_one({'user_id': user_id})
    
    if not cart or not cart.get('items'):
        return jsonify({'error': 'Cart is empty'}), 400
    
    # Calculate total
    total = 0
    order_items = []
    
    for item in cart['items']:
        try:
            product = db.products.find_one({'_id': ObjectId(item['product_id'])})
        except Exception:
            continue  # Skip invalid product IDs
        if product:
            subtotal = product['price'] * item['quantity']
            total += subtotal
            
            order_items.append({
                'product_id': str(product['_id']),
                'name': product['name'],
                'price': product['price'],
                'quantity': item['quantity'],
                'subtotal': subtotal
            })
    
    # Create order
    order = {
        'user_id': user_id,
        'items': order_items,
        'total': total,
        'status': 'completed',
        'created_at': datetime.now().isoformat()
    }
    
    result = db.orders.insert_one(order)
    
    # Clear cart
    db.carts.update_one(
        {'user_id': user_id},
        {'$set': {'items': []}}
    )
    
    return jsonify({
        'message': 'Order placed successfully',
        'order_id': str(result.inserted_id),
        'total': total
    })

# ==================== ADMIN ROUTES ====================

@app.route('/api/admin/dashboard', methods=['GET'])
@token_required
@admin_required
def get_dashboard_stats():
    """Get dashboard statistics"""
    total_users = db.users.count_documents({'is_canary': False})
    total_products = db.products.count_documents({})
    total_orders = db.orders.count_documents({})
    
    # Recent threats (last 24 hours)
    yesterday = (datetime.now() - timedelta(days=1)).isoformat()
    recent_threats = db.request_logs.count_documents({
        'timestamp': {'$gte': yesterday}
    })
    
    # Blockchain stats
    blockchain_stats = blockchain_logger.get_statistics()
    
    # Active sessions
    active_sessions = len(threat_detector.session_memory)
    
    return jsonify({
        'users': total_users,
        'products': total_products,
        'orders': total_orders,
        'threats_24h': recent_threats,
        'active_sessions': active_sessions,
        'blockchain': blockchain_stats
    })

@app.route('/api/admin/threats/live', methods=['GET'])
@token_required
@admin_required
def get_live_threats():
    """Get real-time threat data"""
    hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
    
    threats = list(db.request_logs.find({
        'timestamp': {'$gte': hour_ago}
    }).sort('timestamp', -1).limit(100))
    
    # Get total count (matching dashboard timeframe)
    total_threats = db.request_logs.count_documents({
        'timestamp': {'$gte': hour_ago}
    })
    
    # Convert ObjectId
    for threat in threats:
        threat['_id'] = str(threat['_id'])
    
    return jsonify({
        'threats': threats,
        'total': total_threats
    })

@app.route('/api/admin/threats/all', methods=['DELETE'])
@token_required
@admin_required
def clear_threats():
    """Clear all threat logs and reset system state"""
    try:
        # 1. Clear DB logs
        result = db.request_logs.delete_many({})
        
        # 2. Clear Manual Bans
        BANNED_IPS.clear()
        
        # 3. Clear AI Memory
        threat_detector.session_memory.clear()
        threat_detector.decision_history.clear()
        
        return jsonify({
            'message': f'System Reset: Deleted {result.deleted_count} logs, cleared bans and AI memory.',
            'count': result.deleted_count
        })
    except Exception as e:
        print(f"ERROR: Failed to clear threats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/blockchain', methods=['GET'])
@token_required
@admin_required
def get_blockchain():
    """Get blockchain audit trail"""
    chain = blockchain_logger.export_blockchain()
    
    return jsonify({
        'blockchain': chain,
        'is_valid': blockchain_logger.verify_integrity()
    })

@app.route('/api/admin/canaries/deploy', methods=['POST'])
@token_required
@admin_required
def deploy_canaries():
    """Deploy canary records"""
    data = request.json
    try:
        count = max(1, min(1000, int(data.get('count', 50))))  # Cap between 1-1000
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid count parameter'}), 400
    
    canaries = canary_generator.deploy_canaries(count)
    
    return jsonify({
        'message': f'Deployed {len(canaries)} canaries',
        'canary_ids': canaries
    })

@app.route('/api/admin/canaries/stats', methods=['GET'])
@token_required
@admin_required
def get_canary_stats():
    """Get canary statistics"""
    stats = canary_generator.get_canary_statistics()
    
    return jsonify(stats)

@app.route('/api/admin/users/export', methods=['GET'])
@token_required
def export_users():
    """Export user data (SENSITIVE - monitored endpoint)
    
    NOTE: This endpoint is intentionally accessible by ANY authenticated user
    (including the 'attacker' role) for DEMO purposes. In production, add
    @admin_required. System B monitors this endpoint via canaries.
    """
    # Get all users
    users = list(db.users.find({}, {'password': 0}))
    
    # Check for canary access BEFORE converting ObjectIds
    # This way we can check the is_canary flag directly
    canaries_found = []
    for user in users:
        if user.get('is_canary', False):
            canaries_found.append({
                'canary_id': user.get('canary_id'),
                'email': user.get('email'),
                'accessed_at': datetime.now().isoformat()
            })
    
    # Build canary check result
    if canaries_found:
        canary_check = {
            'breach_detected': True,
            'canaries_accessed': canaries_found,
            'alert_level': 'CRITICAL',
            'message': f'{len(canaries_found)} canary record(s) accessed - BREACH CONFIRMED'
        }
        
        # ALERT: Canary accessed!
        print(f"🚨 SYSTEM B TRIGGERED: {len(canaries_found)} canaries accessed!")
        socketio.emit('canary_triggered', canary_check)  # Remove broadcast=True
        
        # Log to blockchain
        blockchain_logger.log_threat_event({
            'type': 'canary_access',
            'session_id': request.headers.get('Session-ID'),
            'user_id': request.current_user.get('user_id'),
            'canaries_accessed': canaries_found,
            'timestamp': datetime.now().isoformat()
        })
    else:
        canary_check = {
            'breach_detected': False,
            'canaries_accessed': [],
            'alert_level': 'NORMAL',
            'message': 'No canary access detected'
        }
    
    # Convert ObjectId AFTER checking canaries
    for user in users:
        user['_id'] = str(user['_id'])
    
    return jsonify({
        'users': users,
        'total': len(users),
        'canary_alert': canary_check
    })

@app.route('/api/admin/ip/unban', methods=['POST'])
@token_required
@admin_required
def unban_ip():
    """Unban an IP address"""
    data = request.json
    ip = data.get('ip')
    
    if not ip:
        return jsonify({'error': 'IP address required'}), 400
    
    if ip in BANNED_IPS:
        BANNED_IPS.remove(ip)
        # Also try to reset any sessions associated with this IP if possible
        # For now, we rely on the session_id from the specific client, 
        # but in a demo, unbanning might imply "forgiving" the attacker.
        # Since we don't have the session ID here easily without tracking, 
        # we might need a workaround or just rely on manual clearing.
        threat_detector.reset_session(ip=ip) 
        return jsonify({'message': f'IP {ip} unbanned successfully'})
    
    # Allow unbanning even if not in manual list (to clear session memory)
    threat_detector.reset_session(ip=ip) 
    return jsonify({'message': f'IP {ip} unbanned / session reset'})

@app.route('/api/admin/ip/block', methods=['POST'])
@token_required
@admin_required
def manual_block_ip():
    """Manually block an IP address"""
    data = request.json
    ip = data.get('ip')
    
    if ip:
        BANNED_IPS.add(ip)
        return jsonify({'message': f'IP {ip} blocked successfully'})
    
    return jsonify({'error': 'IP address required'}), 400

@app.route('/api/admin/ip/list', methods=['GET'])
@token_required
@admin_required
def get_banned_ips():
    """Get list of banned IPs"""
    return jsonify({
        'banned_ips': list(BANNED_IPS),
        'count': len(BANNED_IPS)
    })

# ==================== WEBSOCKET EVENTS ====================

@socketio.on('connect')
def handle_connect():
    """Client connected"""
    print(f"Client connected")
    emit('connected', {'message': 'Connected to threat monitoring'})

@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected"""
    print(f"Client disconnected")

@socketio.on('join_admin')
def handle_join_admin():
    """Admin joins real-time monitoring"""
    emit('joined', {'room': 'admin_monitor'})

@socketio.on('subscribe_threats')
def handle_subscribe_threats():
    """Subscribe to threat updates"""
    emit('subscribed', {'feed': 'threats'})

# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
