#!/usr/bin/env python3
"""
GameHub Frontend Development Server
A simple HTTP server to serve static files during development
"""

import os
import sys
import http.server
import socketserver
import webbrowser
from pathlib import Path

# Configuration
DEFAULT_PORT = 3000
DEFAULT_HOST = 'localhost'
FRONTEND_DIR = 'frontend'

class GameHubHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler for GameHub frontend"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        # Cache control for development
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format with colors"""
        timestamp = self.log_date_time_string()
        method = args[0].split()[0] if args else ''
        
        # Color codes
        colors = {
            'GET': '\033[92m',      # Green
            'POST': '\033[94m',     # Blue
            'PUT': '\033[93m',      # Yellow
            'DELETE': '\033[91m',   # Red
            'OPTIONS': '\033[95m',  # Magenta
            'RESET': '\033[0m'      # Reset
        }
        
        color = colors.get(method, colors['RESET'])
        print(f"{color}[{timestamp}] {format % args}{colors['RESET']}")

def find_free_port(start_port=DEFAULT_PORT):
    """Find a free port starting from the given port"""
    import socket
    
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"No free port found starting from {start_port}")

def check_frontend_structure():
    """Check if frontend directory structure exists"""
    frontend_path = Path(FRONTEND_DIR)
    
    if not frontend_path.exists():
        print(f"❌ Frontend directory '{FRONTEND_DIR}' not found!")
        print(f"💡 Create the frontend directory structure first.")
        return False
    
    index_file = frontend_path / 'index.html'
    if not index_file.exists():
        print(f"❌ index.html not found in '{FRONTEND_DIR}'!")
        print(f"💡 Create the main index.html file first.")
        return False
    
    return True

def print_banner(host, port):
    """Print server startup banner"""
    banner = f"""
🔥 =============================================== 🔥
   GAMEHUB FRONTEND DEVELOPMENT SERVER
🔥 =============================================== 🔥

🌐 Server URL: http://{host}:{port}
📁 Serving:    {os.path.abspath(FRONTEND_DIR)}
🚀 Status:     Development Mode

📋 Available URLs:
   • Main Site:     http://{host}:{port}/
   • Player Login:  http://{host}:{port}/pages/auth/login.html
   • Browse Events: http://{host}:{port}/pages/player/browse-events.html
   • Create Event:  http://{host}:{port}/pages/organizer/create-event.html

⚡ Backend API should be running on: http://127.0.0.1:8000

🛑 Press Ctrl+C to stop the server
🔥 =============================================== 🔥
"""
    print(banner)

def main():
    """Main server function"""
    # Parse command line arguments
    port = DEFAULT_PORT
    host = DEFAULT_HOST
    auto_open = True
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"❌ Invalid port: {sys.argv[1]}")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        host = sys.argv[2]
    
    if '--no-open' in sys.argv:
        auto_open = False
    
    # Check frontend structure
    if not check_frontend_structure():
        sys.exit(1)
    
    try:
        # Find free port if default is occupied
        try:
            port = find_free_port(port)
        except RuntimeError as e:
            print(f"❌ {e}")
            sys.exit(1)
        
        # Create and start server
        with socketserver.TCPServer((host, port), GameHubHTTPRequestHandler) as httpd:
            print_banner(host, port)
            
            # Open browser automatically
            if auto_open:
                try:
                    webbrowser.open(f'http://{host}:{port}')
                    print(f"🌐 Opening browser at http://{host}:{port}")
                except Exception as e:
                    print(f"⚠️  Could not open browser: {e}")
            
            # Start serving
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n\n🛑 Server shutdown requested...")
                print("👋 GameHub development server stopped.")
                print("🔥 Thanks for developing with GameHub!")
    
    except OSError as e:
        print(f"❌ Server error: {e}")
        if "Address already in use" in str(e):
            print(f"💡 Port {port} is already in use. Try a different port:")
            print(f"   python server.py {port + 1}")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
