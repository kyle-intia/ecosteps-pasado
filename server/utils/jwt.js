const jwt = require('jsonwebtoken');

// Get JWT secrets from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-fallback-refresh-secret';

const defaults = {
  audience: ["User"],
};

const accessTokenSignOptions = {
  expiresIn: "15m",
  secret: JWT_SECRET,
};

const refreshTokenSignOptions = {
  expiresIn: "30d",
  secret: JWT_REFRESH_SECRET,
};

const signToken = (payload, options) => {
  const { secret, ...signOpts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...defaults,
    ...signOpts,
  });
};

const verifyToken = (token, options) => {
  const { secret = JWT_SECRET, audience, ...verifyOpts } = options || {};
  try {
    const payload = jwt.verify(token, secret, {
      ...(audience ? { audience } : {}),
      ...verifyOpts,
    });
    return {
      payload,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
};

module.exports = {
  signToken,
  verifyToken,
  refreshTokenSignOptions,
};