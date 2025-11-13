"""
Simple HTTP server to expose Python agents via REST API
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os

# Add agents to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agents'))

from chat_agent import ChatAgent


class AgentRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for agent"""

    # Initialize agent (shared across requests)
    agent = None

    @classmethod
    def initialize_agent(cls):
        """Initialize the agent"""
        if cls.agent is None:
            cls.agent = ChatAgent({
                'system_prompt': os.getenv('SYSTEM_PROMPT', 'You are a helpful assistant.'),
                'max_history': int(os.getenv('MAX_HISTORY', '20'))
            })
            cls.agent.initialize()

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/execute':
            self._handle_execute()
        elif self.path == '/health':
            self._handle_health()
        else:
            self._send_error(404, 'Not Found')

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self._handle_health()
        elif self.path == '/history':
            self._handle_history()
        else:
            self._send_error(404, 'Not Found')

    def _handle_execute(self):
        """Execute agent with provided message"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)

            message = data.get('message')
            if not message:
                self._send_error(400, 'Missing message field')
                return

            # Execute agent
            self.initialize_agent()
            response = self.agent.execute(message)

            # Send response
            self._send_json({
                'status': 'success',
                'response': response
            })

        except Exception as e:
            self._send_error(500, str(e))

    def _handle_health(self):
        """Health check endpoint"""
        self._send_json({
            'status': 'healthy',
            'agent': self.agent.name if self.agent else 'not initialized'
        })

    def _handle_history(self):
        """Get chat history"""
        self.initialize_agent()
        self._send_json({
            'status': 'success',
            'history': self.agent.get_history()
        })

    def _send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_error(self, status, message):
        """Send error response"""
        self._send_json({
            'status': 'error',
            'message': message
        }, status)

    def log_message(self, format, *args):
        """Log requests"""
        print(f"{self.address_string()} - {format % args}")


def run_server(port=8080):
    """Run the HTTP server"""
    print(f"Starting agent server on port {port}...")
    server = HTTPServer(('0.0.0.0', port), AgentRequestHandler)
    print(f"Server running at http://0.0.0.0:{port}")
    print("Endpoints:")
    print("  POST /execute - Execute agent")
    print("  GET  /health  - Health check")
    print("  GET  /history - Get chat history")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()


if __name__ == '__main__':
    port = int(os.getenv('PORT', '8080'))
    run_server(port)
