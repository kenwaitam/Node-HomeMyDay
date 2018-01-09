import * as bcrypt from 'bcrypt';
import express = require('express');
import { ValidationError } from 'mongoose';
import User from '../../model/user.model';
import { AuthenticationService } from '../../service/authentication.service';
import { expressAsync } from '../../utils/express.async';
import { ApiError } from '../errors/api.error';

const routes = express.Router();

routes.post('/login', expressAsync(async (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({email});

    const result = await user.comparePassword(password);

    if (!result) {
        throw new ApiError(400, 'Invalid email or password!');
    }

    const token = AuthenticationService.generateToken(user.email);

    res.status(200).json({ token });
}));

routes.post('/authorize', expressAsync(async (req, res, next) => {
    const usr = req.body.username;
    const pwd = req.body.password;

    const user = await User.findOne({ username: usr });

    // check if user exist
    if (user) {
        const check = await bcrypt.compare(pwd, user.password);
        if (check) {
            res.status(200).json(user);
        } else {
            res.status(401).json('User Not Authorized');
        }
    } else {
        res.status(404).json('User Not Found');
    }
}));

routes.post('/register', expressAsync(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const user = new User({
        email,
        password
    });

    try {
        await user.save();
    } catch (e) {
        if (e.name === 'ValidationError') {
            throw new ApiError(400, e.message);
        } else {
            throw e;
        }
    }

    res.status(201).end();
}));

export default routes;
