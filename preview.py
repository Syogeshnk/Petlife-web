#!/usr/bin/env python3
"""Local preview server for the Petlife site.

Serves Website/ the way Cloudflare Workers Assets serves dist/ in production:
a request for /careers resolves to careers.html. A plain `python -m http.server`
does not do this, so every internal link (which are all extensionless now)
404s under it — the local preview stops matching production exactly where it
matters most.

    python preview.py            # http://127.0.0.1:5500
    python preview.py 8080       # pick another port
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Website")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5500


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        # Only the extensionless case needs help; real files and directories
        # already resolve, and "/" still maps to index.html upstream.
        if not os.path.exists(local) and not os.path.splitext(local)[1]:
            candidate = local + ".html"
            if os.path.isfile(candidate):
                return candidate
        return local

    def end_headers(self):
        # Preview should always reflect the last save, never a cached copy.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    handler = partial(Handler, directory=ROOT)
    with ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print("Petlife preview -> http://127.0.0.1:%d" % PORT)
        print("serving %s (extensionless URLs resolve, as on Cloudflare)" % ROOT)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
