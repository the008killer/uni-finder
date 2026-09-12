const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ success: false, error: 'No Token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Token formatting invalid' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adds { id: userId } to request object
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Token is not valid' });
    }
};