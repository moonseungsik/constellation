import os
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer

PORT = 8000
PROJECT_DIR = r"C:\Users\astrocamp\.gemini\antigravity-ide\scratch\starry-night-custom"
JSON_PATH = os.path.join(PROJECT_DIR, "starry_data.json")

class PlanetariumRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve static files from the project directory
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/api/save_calibration':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                calibration_data = json.loads(post_data.decode('utf-8'))
                name = calibration_data.get('name')
                
                if not name:
                    self.send_error_response(400, "Constellation name is missing.")
                    return
                
                # Load JSON file
                if not os.path.exists(JSON_PATH):
                    self.send_error_response(404, "starry_data.json not found.")
                    return
                
                with open(JSON_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Find and update constellation
                constellations = data.get('constellations', [])
                found = False
                for c in constellations:
                    if c.get('name') == name:
                        c['ra'] = float(calibration_data['ra'])
                        c['dec'] = float(calibration_data['dec'])
                        c['width_deg'] = float(calibration_data['width_deg'])
                        c['height_deg'] = float(calibration_data['height_deg'])
                        c['position_angle'] = float(calibration_data['position_angle'])
                        c['flip_h'] = bool(calibration_data.get('flip_h', False))
                        c['flip_v'] = bool(calibration_data.get('flip_v', False))
                        found = True
                        break
                
                if not found:
                    self.send_error_response(404, f"Constellation '{name}' not found in database.")
                    return
                
                # Save JSON file
                with open(JSON_PATH, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"success": True, "message": f"{name} calibration saved successfully!"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"Server: Successfully updated calibration for {name}")
                
            except Exception as e:
                self.send_error_response(500, f"Error updating JSON: {str(e)}")
        else:
            self.send_error_response(404, "Not found")

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {"success": False, "message": message}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_OPTIONS(self):
        # Support preflight CORS requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    os.chdir(PROJECT_DIR)
    server = HTTPServer(('localhost', PORT), PlanetariumRequestHandler)
    print(f"Planetarium Custom API Server running on http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.server_close()
