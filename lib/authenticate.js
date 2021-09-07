const jwt = require('jsonwebtoken');

const secretKey = "SuperSecret";

function generateAuthToken(userId, admin) {
  console.log("==generateAuthToken", userId, admin)
  const payload = { userId: userId, admin: admin };
  return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}
exports.generateAuthToken = generateAuthToken;

function requireAuthentication(req, res, next) {
   console.log("requireAuthentication")
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {
    const payload = jwt.verify(token, secretKey);
    req.userId = payload.userId;
    req.admin = payload.admin;
    next();
  } catch (err) {
    res.status(401).send({
      error: "Invalid authentication token."
    });
  }
}
exports.requireAuthentication = requireAuthentication;

function checkAdmin(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {
    const payload = jwt.verify(token, secretKey);
    req.userId = payload.userId;
    req.admin = payload.admin;
    next();
  } catch (err) {
    req.userId = null;
    req.admin = null;
    next()
  }
}
exports.checkAdmin = checkAdmin;