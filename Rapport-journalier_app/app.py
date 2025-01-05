import http.server
import socketserver
import webbrowser
import os
import sys

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=resource_path("."), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server():
    PORT = 8000
    
    while True:
        try:
            with socketserver.TCPServer(("", PORT), MyHttpRequestHandler) as httpd:
                print(f"Server started at http://localhost:{PORT}")
                webbrowser.open(f'http://localhost:{PORT}')
                httpd.serve_forever()
        except OSError:
            PORT += 1
            continue
        break

if __name__ == '__main__':
    run_server()
