import http.server
import socketserver
import webbrowser
import os
from threading import Timer

PORT = 8000
HOST = "localhost"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

def start_server():
    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        print(f"Serving at http://{HOST}:{PORT}")
        webbrowser.open_new_tab(f"http://{HOST}:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    start_server()