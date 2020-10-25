const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const salt = 10;

require('dotenv').config();

const secretKey = process.env.SECRET;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true,
        maxlength: 80
    },
    lastName: {
        type: String,
        required: true,
        maxlength: 80
    },
    phone: {
        type: String,
        required: true,
        maxlength: 12
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    token: {
        type: String
    }
}, { versionKey: false });

userSchema.pre('save', function (next) {
    const user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(salt, (err, salt) => {
            if (err) return next(err);

            bcrypt.hash(user.password, salt, (err, hash) => {
                if (err) return next(err);

                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        if (err) return cb(next);
        cb(null, isMatch);
    });
}

userSchema.methods.generateToken = function (cb) {
    const user = this;
    const token = jwt.sign(user._id.toHexString(), secretKey);

    user.token = token;
    user.save(function (err, user) {
        if (err) return cb(err);
        cb(null, user);
    })
}

userSchema.statics.findByToken = function (token, cb) {
    const user = this;

    jwt.verify(token, secretKey, function (err, decode) {
        user.findOne({ "_id": decode, "token": token }, function (err, user) {
            if (err) return cb(err);
            cb(null, user);
        })
    })
};

userSchema.methods.deleteToken = function (token, cb) {
    const user = this;

    user.updateOne({ $unset: { token: 1 } }, (err, user) => {
        if (err) return cb(err);

        cb(null, user);
    })
};


module.exports = mongoose.model('User', userSchema);