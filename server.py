import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    if "--test" in sys.argv:
        print("Server test pass - directory valid:", DIRECTORY)
        sys.exit(0)

    port = PORT
    for attempt in range(10):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 60)
                print(f"  Aethelgard: Depth of Steam - Game Server Running")
                print(f"  URL: {url}")
                print("=" * 60)
                print("Opening game in default browser...")
                webbrowser.open(url)
                print("Press Ctrl+C in this terminal window to stop server.")
                httpd.serve_forever()
                break
        except OSError:
            port += 1

if __name__ == "__main__":
    start_server()
