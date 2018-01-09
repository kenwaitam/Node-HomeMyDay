import * as bcrypt from 'bcrypt';
import express = require('express');
import { IUserDocument } from '../../model/schemas/user.schema';
import User from '../../model/user.model';
import { expressAsync } from '../../utils/express.async';

const router = express.Router();

router.post('/', expressAsync(async (req, res, next) => {
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

export default router;
