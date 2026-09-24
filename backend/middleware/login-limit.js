// Limite adicional por IP para instância única. Em várias réplicas, usar armazenamento compartilhado.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
const timer = setInterval(() => {
  for (const [key, value] of attempts)
    if (value.until < Date.now()) attempts.delete(key);
}, 60000);
timer.unref();
module.exports = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  let state = attempts.get(key);
  if (!state || state.until <= now) {
    state = { count: 0, until: now + WINDOW };
    attempts.set(key, state);
  }
  if (++state.count > 50) {
    res.set("Retry-After", String(Math.ceil((state.until - now) / 1000)));
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde antes de tentar novamente." });
  }
  next();
};
