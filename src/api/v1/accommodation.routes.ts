import express = require('express');

import { CastError } from 'mongoose';
import { Accommodation, IAccommodationModel } from '../../model/accommodation.model';
import { IAccommodationDocument } from '../../model/schemas/accommodation.schema';
import { AccommodationService } from '../../service/accommodation.service';
import { expressAsync } from '../../utils/express.async';
import { ValidationHelper } from '../../utils/validationhelper';
import { ApiError } from '../errors/index';

const routes = express.Router();

routes.get('/', expressAsync(async (req, res, next) => {
    const accommodations = await AccommodationService.getAccommodations();

    res.json(accommodations);
}));

routes.get('/:id', expressAsync(async (req, res, next) => {

    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);

    res.json(accommodation);
}));

routes.post('/', expressAsync(async (req, res, next) => {
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
        cancellationText: reqBody.cancellationText
    } as IAccommodationDocument;

    const accommodation = await AccommodationService.addAccommodation(newAccomodation);

    res.status(201).send(accommodation);
}));

routes.put('/:id', expressAsync(async (req, res, next) => {

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

routes.delete('/:id', expressAsync(async (req, res, next) => {
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
