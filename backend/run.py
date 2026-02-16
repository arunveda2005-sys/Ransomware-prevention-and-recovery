
import os
import sys

# Get the directory of this script (backend/)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the project root (parent of backend/)
project_root = os.path.dirname(current_dir)

# Add project root to sys.path to allow imports of 'backend' and 'blockchain' packages
sys.path.insert(0, project_root)

from backend.app import app, socketio

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    # Check for FLASK_DEBUG in environment
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting server on port {port} with debug={debug}")
    print(f"Project root added to path: {project_root}")
    
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)
