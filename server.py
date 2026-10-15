"""Local static server. Python standard library only; no repository access."""
import argparse
import http.server
import os
import socketserver
import webbrowser
from pathlib import Path
ROOT=Path(__file__).resolve().parent
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def do_GET(self):
  if self.path=='/':self.path='/web/index.html'
  return super().do_GET()
 def send_head(self):
  path=Path(self.translate_path(self.path))
  if '.gz' not in self.path and path.is_file() and path.with_suffix(path.suffix+'.gz').exists() and 'gzip' in self.headers.get('Accept-Encoding',''):
   f=path.with_suffix(path.suffix+'.gz').open('rb');self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Encoding','gzip');self.send_header('Content-Length',str(os.fstat(f.fileno()).st_size));self.send_header('Cache-Control','no-cache');self.end_headers();return f
  return super().send_head()
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-cache');super().end_headers()
 def log_message(self,format,*args):pass
class LocalServer(socketserver.ThreadingTCPServer):
 allow_reuse_address=True
 daemon_threads=True

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8765);p.add_argument('--open-browser',action='store_true');a=p.parse_args()
 with LocalServer(('127.0.0.1',a.port),Handler) as httpd:
  print(f'APEX DEVELOPMENT BENCH v0 → http://127.0.0.1:{a.port}',flush=True)
  if a.open_browser:webbrowser.open(f'http://127.0.0.1:{a.port}')
  try:httpd.serve_forever()
  except KeyboardInterrupt:pass
