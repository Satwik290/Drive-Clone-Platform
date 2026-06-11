const IdempotencyKey = require('../models/IdempotencyKey');

module.exports = async (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const key = req.headers['x-idempotency-key'];
    if (!key) {
      return res.status(400).json({ error: 'Idempotency key required' });
    }
    try {
      await IdempotencyKey.create({ key });
      next();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Duplicate request detected (Idempotency Key)' });
      }
      return res.status(500).json({ error: 'Internal Server Error check idempotency' });
    }
  } else {
    next();
  }
};
