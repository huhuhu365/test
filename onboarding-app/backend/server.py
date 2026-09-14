from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from app import handle, response


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.dispatch()

    def do_POST(self):
        self.dispatch()

    def dispatch(self):
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 <= length <= 16384:
                result = response(413, {'message': '入力内容が大きすぎます。'})
            else:
                body = self.rfile.read(length).decode('utf-8')
                result = handle(self.command, urlsplit(self.path).path, dict(self.headers), body)
        except (ValueError, UnicodeError):
            result = response(400, {'message': 'リクエストが不正です。'})
        payload = result['body'].encode('utf-8')
        self.send_response(result['statusCode'])
        for key, value in result['headers'].items():
            self.send_header(key, value)
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


if __name__ == '__main__':
    print('Open http://127.0.0.1:8010', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8010), Handler).serve_forever()
