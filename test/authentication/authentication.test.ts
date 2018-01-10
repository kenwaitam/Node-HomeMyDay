import * as assert from 'assert';
import * as bcrypt from 'bcrypt';
import 'mocha';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { User } from '../../src/model/user.model';
import { mochaAsync } from '../test.helper';
const app = require('../../src/index').default;

describe('Authentication', () => {

    // Add user
    beforeEach(mochaAsync(async () => {
        const user = new User({
            email: 'test@example.com',
            password: 'Test123'
        });

        await user.save();
    }));

    it('Create user', mochaAsync(async () => {
        const count = await User.count({});

        assert(count > 0);
    }));

    it('Return status 200', mochaAsync(async () => {
        const response = await request(app).post('/api/v1/authentication/login').send({
            email: 'test@example.com',
            password: 'Test123',
        }).expect(200);
    }));

    it('Return status 400', mochaAsync(async () => {
        const response = await request(app).post('/api/v1/authentication/login').send({
            email: 'test@example.com',
            password: 'Test321',
        }).expect(400);
    }));

    it('POST /api/v1/authentication', mochaAsync(async () => {
        const response = await request(app).post('/api/v1/authentication/login').send({
            email: 'test@example.com',
            password: 'Test123',
        }).expect(200);
    }));

    it('Tries to register a new user', mochaAsync(async () => {
        const response = await request(app)
        .post('/api/v1/authentication/register')
        .send({
            email: 'test2@example.com',
            password: 'secret'
        })
        .expect(201);
    }));

    it('Tries to register an already existing user', mochaAsync(async () => {
        const response = await request(app)
        .post('/api/v1/authentication/register')
        .send({
            email: 'test@example.com',
            password: 'secret'
        })
        .expect(400);

        const err = response.body;

        assert(err !== null);
        assert(err.errors.length > 0);
    }));

    // Remove all users
    afterEach(mochaAsync(async () => {
        await User.remove({});
    }));
});
