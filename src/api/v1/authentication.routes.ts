import * as bcrypt from 'bcrypt';
import express = require('express');
import * as ExpressBrute from 'express-brute';
import * as MemcachedStore from 'express-brute-memcached';
import { ValidationError } from 'mongoose';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';
import { ApiError, AuthenticationError } from '../../errors/index';
import { IUserDocument } from '../../model/schemas/user.schema';
import User from '../../model/user.model';
import { AuthenticationService } from '../../service/authentication.service';
import { expressAsync } from '../../utils/express.async';
import { authenticationMiddleware } from '../middleware/authentication.middleware';
import { BruteForce } from '../middleware/brutelimite.class';

const routes = express.Router();

routes.post('/login', BruteForce.limiter(),
    expressAsync(async (req, res, next) => {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            throw new ApiError(400, 'Invalid email or password!');
        }

        let user: IUserDocument;
        try {
            user = await AuthenticationService.authenticateUser(email, password, req.body.token);

        } catch (e) {
            if (e instanceof AuthenticationError) {
                throw new ApiError(400, e.message);
            } else {
                throw e;
            }
        }
        const token = AuthenticationService.generateToken(user);
        res.status(200).json({ token });
    }));

routes.post('/twofactor/setup', authenticationMiddleware, expressAsync(async (req, res, next) => {
    const secret = speakeasy.generateSecret({ length: 10 });
    const user = req.authenticatedUser;
    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {

        // save to logged in user.
        user.tfa = {
            secret: '',
            tempSecret: secret.base32,
            dataURL: dataUrl,
            otpURL: secret.otpauth_url
        };

        user.save();

        return res.json({
            tempSecret: secret.base32,
            dataURL: dataUrl,
            otpURL: secret.otpauth_url
        });
    });
}));

// before enabling totp based 2fa; it's important to verify,
// so that we don't end up locking the user.
routes.post('/twofactor/verify', authenticationMiddleware, expressAsync(async (req, res, next) => {
    const user = req.authenticatedUser;

    const verified = speakeasy.totp.verify({
        // secret of the logged in user
        secret: user.tfa.tempSecret,
        encoding: 'base32',
        token: req.body.token
    });

    console.log(verified);
    if (verified) {
        // set secret, confirm 2fa
        user.tfa.secret = user.tfa.tempSecret;
        await user.save();
        return res.json(true);
    }
    return res.status(400).json('Invalid token, verification failed');

}));

// get 2fa details
routes.get('/twofactor/setup', authenticationMiddleware, expressAsync(async (req, res, next) => {
    const user = req.authenticatedUser;
    res.json(user.tfa);
}));

// disable 2fa
routes.delete('/twofactor/setup', authenticationMiddleware, expressAsync(async (req, res, next) => {
    const user = req.authenticatedUser;
    user.tfa = undefined;
    await user.save();
    res.json(true);
}));

routes.post('/register', expressAsync(async (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        throw new ApiError(400, 'email and password are required!');
    }

    try {
        await AuthenticationService.registerUser(email, password);
    } catch (e) {
        if (e.name === 'ValidationError') {
            throw new ApiError(400, e.message);
        } else {
            throw e;
        }
    }

    res.status(201).end();
}));

routes.post('/changepassword', authenticationMiddleware, expressAsync(async (req, res, next) => {

    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'oldPassword and newPassword are required!');
    }

    // Change password
    try {
        await AuthenticationService.changePassword(req.authenticatedUser.id, oldPassword, newPassword);
    } catch (e) {
        if (e instanceof AuthenticationError) {
            throw new ApiError(400, e.message);
        } else {
            throw e;
        }
    }

    res.status(204).end();
}));

export default routes;
