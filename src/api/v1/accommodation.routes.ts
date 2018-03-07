import express = require('express');
import { CastError } from 'mongoose';
import { ApiError } from '../../errors/index';
import { Accommodation, IAccommodationModel } from '../../model/accommodation.model';
import { ApproveStatus, IAccommodationDocument } from '../../model/schemas/accommodation.schema';
import { IApproveStatusDocument } from '../../model/schemas/approvestatus.schema';
import { IImageDocument } from '../../model/schemas/image.schema';
import { UserRoles } from '../../model/schemas/user.schema';
import { AccommodationService } from '../../service/accommodation.service';
import { ImageService } from '../../service/image.service';
import { expressAsync } from '../../utils/express.async';
import { upload } from '../../utils/multer';
import { ValidationHelper } from '../../utils/validationhelper';
import { BruteMiddleware } from '../middleware/brute.middleware';
import { adminMiddleware, authenticationMiddleware } from '../middleware/index';

const routes = express.Router();

routes.get('/', BruteMiddleware.globalBruteforce().prevent, expressAsync(async (req, res, next) => {

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

routes.get('/awaiting', authenticationMiddleware, adminMiddleware, expressAsync(async (req, res, next) => {

    const accommodations = await AccommodationService.getAwaitingAccommodations();
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

routes.post('/', authenticationMiddleware, expressAsync(async (req, res, next) => {
    // Get the user id
    const userId = req.authenticatedUser._id;

    const reqBody = req.body;

    // Approve status should be awaiting, unless the creator is an admin.
    let approveStatus;
    if (req.authenticatedUser.role === UserRoles.Administrator) {
        approveStatus = ApproveStatus.Approved;
    } else {
        approveStatus = ApproveStatus.Awaiting;
    }

    const approveStatusSchema = {
        status: approveStatus,
        reason: ''
    } as IApproveStatusDocument;

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
        price: reqBody.price,
        spaceText: reqBody.spaceText,
        servicesText: reqBody.servicesText,
        pricesText: reqBody.pricesText,
        rulesText: reqBody.rulesText,
        cancellationText: reqBody.cancellationText,
        approveStatus: approveStatusSchema,
        userId
    } as IAccommodationDocument;

    const accommodation = await AccommodationService.addAccommodation(newAccomodation);

    res.status(201).send(accommodation);
}));

routes.put('/:id/recommendation', authenticationMiddleware, adminMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);

    if (!accommodation) {
        throw new ApiError(404, 'Accommodation not found');
    }

    const updatedAccommodation = await AccommodationService.updateRecommendation(req.params.id, req.body.recommended);

    res.status(200).json(updatedAccommodation);
}));

routes.put('/:id/approval', authenticationMiddleware, adminMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);
    if (!accommodation) {
        throw new ApiError(404, 'Accommodation not found');
    }

    const updatedAccommodation = await AccommodationService.updateApproval(req.params.id,
        req.body.status,
        req.body.reason);

    res.status(200).json(updatedAccommodation);
}));

routes.put('/:id', authenticationMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    // Regular users should not be able to recommend accommodations
    delete req.body.recommended;
    delete req.body.images;

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

routes.post('/:id/images', authenticationMiddleware, upload.single('file'), expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    if (!req.file) {
        throw new ApiError(404, 'file not found');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);

    if (!accommodation) {
        throw new ApiError(404, 'Accommodation not found');
    }

    const newImage = await ImageService.addImage(accommodation.id, req.file, req.body.title);
    const newUuid = {
        uuid: newImage.uuid
    };

    res.status(200).json(newUuid);
}));

routes.delete('/:id/images/:imageUuid', authenticationMiddleware, expressAsync(async (req, res, next) => {
    if (!ValidationHelper.isValidMongoId(req.params.id)) {
        throw new ApiError(400, 'Invalid ID!');
    }

    const accommodation = await AccommodationService.getAccommodation(req.params.id);

    if (!accommodation) {
        throw new ApiError(404, 'Accommodation not found');
    }

    await ImageService.deleteImage(accommodation.id, req.params.imageUuid);

    res.sendStatus(204);
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
