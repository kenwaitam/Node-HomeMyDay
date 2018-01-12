import express = require('express');

import { CastError } from 'mongoose';
import { ApiError } from '../../errors/index';
import { Accommodation, IAccommodationModel } from '../../model/accommodation.model';
import { IAccommodationDocument } from '../../model/schemas/accommodation.schema';
import { AccommodationService } from '../../service/accommodation.service';
import { expressAsync } from '../../utils/express.async';
import { ValidationHelper } from '../../utils/validationhelper';
import { authenticationMiddleware } from '../middleware/index';

const routes = express.Router();

routes.get('/', expressAsync(async (req, res, next) => {

    let accommodations;

    if (req.query.search && req.query.dateFrom && req.query.dateTo && req.query.persons) {
        accommodations = await AccommodationService.searchAccommodations(
            req.query.search,
            new Date(req.query.dateFrom),
            new Date(req.query.dateTo),
            req.query.persons);
    } else {
        accommodations = await AccommodationService.getAccommodations();
    }

    res.json(accommodations);
}));

routes.get('/me', authenticationMiddleware, expressAsync(async (req, res, next) => {
    // Get the user id
    const userId = req.authenticatedUser.id;

    const accommodations = await AccommodationService.getForUser(userId);

    res.json(accommodations);
}));

routes.get('/:id', expressAsync(async (req, res, next) => {

    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);

    if (!accommodation) {
        throw new ApiError(404, 'Accommodation not found');
    }

    res.json(accommodation);
}));

routes.get('/recommend', expressAsync(async (req, res, next) => {
    let accommodations;

    if (req.query.search && req.query.dateFrom && req.query.dateTo && req.query.persons) {
        accommodations = await AccommodationService.searchAccommodations(
            req.query.search,
            new Date(req.query.dateFrom),
            new Date(req.query.dateTo),
            req.query.persons);
    } else {
        accommodations = await AccommodationService.getAccommodations();
    }

    res.json(accommodations);
}));

routes.post('/', authenticationMiddleware, expressAsync(async (req, res, next) => {
    // Get the user id
    const userId = req.authenticatedUser._id;

    const reqBody = req.body;

    const newAccomodation = {
        name: reqBody.name,
        description: reqBody.description,
        maxPersons: reqBody.maxPersons,
        continent: reqBody.continent,
        country: reqBody.country,
        location: reqBody.location,
        latitude: reqBody.latitude,
        longitude: reqBody.longitude,
        rooms: reqBody.rooms,
        beds: reqBody.beds,
        recommended: reqBody.recommended,
        price: reqBody.price,
        spaceText: reqBody.spaceText,
        servicesText: reqBody.servicesText,
        pricesText: reqBody.pricesText,
        rulesText: reqBody.rulesText,
        cancellationText: reqBody.cancellationText,
        userId
    } as IAccommodationDocument;

    const accommodation = await AccommodationService.addAccommodation(newAccomodation);

    res.status(201).send(accommodation);
}));

routes.put('/:id', authenticationMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    let accommodation;

    try {
        accommodation = await AccommodationService.updateAccommodation(req.params.id, req.body);
    } catch (err) {
        if (err instanceof CastError as any) {
            throw new ApiError(400, err.path + ' must be of type ' + err.kind);
        } else {
            throw err;
        }
    }

    res.json(accommodation);
}));

routes.delete('/:id', authenticationMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid id supplied!');
    }

    const response = await AccommodationService.deleteAccommodation(req.params.id);
    if (!response) {
        throw new ApiError(400, 'Invalid id supplied!');
    } else {
        res.sendStatus(204);
    }
}));

export default routes;
