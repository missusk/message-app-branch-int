const jwt = require('jsonwebtoken');

// checking JWT token for protected routes

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied, token missing' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();

    }

    catch (err) {
        console.error(err.message);
        res.status(403).json({ error: 'Access denied, token invalid' });
    }

};

module.exports = authenticateToken;