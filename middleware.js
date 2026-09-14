// Password-protects the archived homepage at /archive with HTTP Basic Auth.
// Any username works; the password is checked below.
export const config = {
  matcher: ['/archive', '/archive.html'],
};

const PASSWORD = 'sam';

export default function middleware(request) {
  const header = request.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const password = decoded.slice(decoded.indexOf(':') + 1);
      if (password === PASSWORD) {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }
    } catch (e) {
      // Malformed header falls through to the challenge
    }
  }
  return new Response('Password required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sam Rahim archive", charset="UTF-8"' },
  });
}
