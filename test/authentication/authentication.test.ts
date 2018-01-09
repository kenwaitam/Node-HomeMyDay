import * as assert from 'assert';
import * as bcrypt from 'bcrypt';
import 'mocha';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { User } from '../../src/model/user.model';
import { mochaAsync } from '../test.helper';
const app = require('../../src/index').default;

describe('Authentication', () => {

    beforeEach(mochaAsync(async () => {
        const user = new User({
            username: 'Test',
            password: await bcrypt.hash('test123', 10),
            role: 'user'
        });

        await user.save();
    }));

    it('Create user', mochaAsync(async () => {
        const count = await User.count({});

        assert(count > 0);
    }));

    // it('Create password hash', mochaAsync(async () => {
    //     const user = await User.findOne({ username: 'Test' });
    //     const password = user.password;
    //     const rounds = 10;
    //     const hash = await bcrypt.hash(password, rounds);
    //     const check = await bcrypt.compare(password, hash);

    //     assert(check);
    // }));

    it('POST /api/v1/authentication', mochaAsync(async () => {
        const response = await request(app).post('/api/v1/authentication').send({
            username: 'Test',
            password: 'test123',
        }).expect(200);

        const { username, password } = response.body;
        // const check = await bcrypt.compare(response.body.password, hash);
        console.log(response.body.password);

        assert(username === 'Test');
        //assert();
    }));
});
