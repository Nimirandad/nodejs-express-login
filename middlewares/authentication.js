const User = require('../models/user');

const auth = (req, res, next) => {
    const token = req.cookies.auth;

    User.findByToken(token, (err, user) => {
        if (err) throw err;
        if (!user) return res.status(401).send({error: "Token not valid or doesn't exist"});

        req.token = token;
        req.user = user;
        next();
    })
}

module.exports = { auth };