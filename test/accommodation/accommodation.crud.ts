import * as assert from 'assert';
import 'mocha';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { Accommodation } from '../../src/model/accommodation.model';
import { AccommodationService } from '../../src/service/accommodation.service';
import { mochaAsync } from '../test.helper';
const app = require('../../src/index').default;

describe('Accommodation', () => {
    describe('Create Read Update Delete', () => {

        let accommodationId;

        beforeEach(mochaAsync(async () => {
            // Create accomodation
            const accommodation = new Accommodation({
                name: 'Test Accommodation',
                maxPersons: 4,
                price: '350'
            });

            await accommodation.save();

            accommodationId = accommodation._id;
        }));

        it('Can get all accommodations', mochaAsync(async () => {
            const response = await request(app)
                .get('/api/v1/accommodations')
                .expect(200);

            const accommodations = response.body;

            assert(accommodations !== null);
            assert(accommodations.length > 0);
            assert(accommodations[0].name === 'Test Accommodation');
        }));

        it('Can get an accommodation by id', mochaAsync(async () => {
            const response = await request(app)
                .get('/api/v1/accommodations/' + accommodationId)
                .expect(200);

            const accommodation = response.body;

            assert(accommodation !== null);
            assert(accommodation.name === 'Test Accommodation');
        }));

        it('Tries to fetch an accommodation by an invalid ID', mochaAsync(async () => {
            const response = await request(app)
                .get('/api/v1/accommodations/jklsiop')
                .expect(400);

            const err = response.body;

            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Can delete an accommodation by id', mochaAsync(async () => {
            const response = await request(app)
                .delete('/api/v1/accommodations/' + accommodationId)
                .expect(204);

            assert(response !== null);
        }));

        it('Can not delete accommodation by an already deleted id', mochaAsync(async () => {
            await request(app)
                .delete('/api/v1/accommodations/' + accommodationId)
                .expect(204);

            const response = await request(app)
                .delete('/api/v1/accommodations/' + accommodationId)
                .expect(400);

            assert(response !== null);

            const err = response.body;
            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Can not delete an accommodation by invalid format id', mochaAsync(async () => {
            const response = await request(app)
                .delete('/api/v1/accommodations/abcdefghjiklmnopqrstuvwxyz')
                .expect(400);

            assert(response !== null);

            const err = response.body;
            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Can update an accommodation', mochaAsync(async () => {

            const accommodation = await AccommodationService.getAccommodation(accommodationId);
            accommodation.name = 'Update Accommodation Test';

            const response = await request(app)
            .put('/api/v1/accommodations/' + accommodationId)
            .send(accommodation)
            .expect(200);

            const newAccommodation = response.body;

            assert(newAccommodation !== null);
            assert(newAccommodation.name === 'Update Accommodation Test');
        }));

        it('Tries to update an accommodation by an invalid ID', mochaAsync(async () => {
            const response = await request(app)
            .put('/api/v1/accommodations/jklsiop')
            .send({ name: 'Invalid' })
            .expect(400);

            const err = response.body;

            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Tries to update an accommodation with invalid values', mochaAsync(async () => {
            let accommodation = await AccommodationService.getAccommodation(accommodationId) as any;
            // Convert to plain object and give it an invalid value
            accommodation = accommodation.toObject();
            accommodation.maxPersons = 'A million!!';

            const response = await request(app)
            .put('/api/v1/accommodations/' + accommodationId)
            .send(accommodation)
            .expect(400);

            const err = response.body;

            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Can create new accommodation', mochaAsync(async () => {
            const count = await Accommodation.count({});
            const response = await request(app)
            .post('/api/v1/accommodations')
            .send({
                name: 'TestName',
                maxPersons: 2,
                price: '200'
            })
            .expect(201);

            const { name, maxPersons, price } = response.body;
            const newCount = await Accommodation.count({});

            assert(count + 1 === newCount);
            assert(name === 'TestName');
            assert(maxPersons === 2);
            assert(price === '200');
        }));

        it('Tries to create new accomodations without some required props', mochaAsync(async () => {
            const count = await Accommodation.count({});
            const response = await request(app)
            .post('/api/v1/accommodations')
            .send({
                maxPersons: 2,
                price: '200'
            })
            .expect(400);

            const err = response.body;
            const newCount = await Accommodation.count({});

            assert(count === newCount);
            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        it('Tries to create new accomodations with invalid props type', mochaAsync(async () => {
            const count = await Accommodation.count({});
            const response = await request(app)
            .post('/api/v1/accommodations')
            .send({
                name: 'TestName',
                maxPersons: 'Test',
                price: '200'
            })
            .expect(400);

            const err = response.body;
            const newCount = await Accommodation.count({});

            assert(count === newCount);
            assert(err !== null);
            assert(err.errors.length > 0);
        }));

        afterEach(mochaAsync(async () => {
            await Accommodation.remove({});
        }));
    });
});
