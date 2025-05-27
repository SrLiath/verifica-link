const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

    try {
        const decoded = jwt.verify(token, 'T5r4e3T5r4e3');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido.' });
    }
};

module.exports = authenticateJWT;