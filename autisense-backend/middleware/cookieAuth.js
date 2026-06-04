const COOKIE_NAME = 'autisense_token';

const MS = {
  d: 86400000,
  h: 3600000,
  m: 60000,
};

function cookieMaxAge() {
  const raw = process.env.JWT_EXPIRE || '7d';
  const n = parseInt(raw, 10);
  const unit = raw.slice(-1);
  if (Number.isFinite(n) && MS[unit]) return n * MS[unit];
  return 7 * MS.d;
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: cookieMaxAge(),
    path: '/',
  });
}

export function clearAuthCookie(res) {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });
}
