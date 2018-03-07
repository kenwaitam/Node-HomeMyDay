import * as bcrypt from 'bcrypt';
import express = require('express');
import { ValidationError } from 'mongoose';
import { ApiError, AuthenticationError } from '../../errors/index';
import { IUserDocument } from '../../model/schemas/user.schema';
import User from '../../model/user.model';
import { AuthenticationService } from '../../service/authentication.service';
import { expressAsync } from '../../utils/express.async';
import { authenticationMiddleware } from '../middleware/authentication.middleware';
import { BruteMiddleware } from '../middleware/brute.middleware';

const routes = express.Router();

routes.post('/login', BruteMiddleware.userBruteforce().prevent,
    BruteMiddleware.userBruteforce().prevent,
    expressAsync(async (req, res, next) => {

        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            throw new ApiError(400, 'Invalid email or password!');
        }

        let user: IUserDocument;

        try {
            user = await AuthenticationService.authenticateUser(email, password);
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
