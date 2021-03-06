import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import mongoose = require('mongoose');
import * as logger from 'morgan';
import * as apiRoutes from './api';
import { ApiError } from './api/errors';
import { Config } from './config/config.const';

const port = Config.port;
const app = express();

app.use(helmet());

app.use(bodyParser.json());

app.use(logger('dev'));

// CORS headers
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', Config.allowOrigin);
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');

    if ('OPTIONS' === req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Add the routes
app.use('/api', apiRoutes);

app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found.',
    });
});

app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('An error has occured!', err.message);
    next(err);
});

app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ApiError) {
        const apiError = err as ApiError;
        res.status(apiError.statusCode).json({
            errors: [apiError.message]
        });
    } else {
        next(err);
    }
});

app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof mongoose.Error && err.name === 'ValidationError') {
        const error = err as any;
        const errors: string[] = [];

        if (error.errors) {
            const keys = Object.keys(error.errors);
            for (const field of keys) {
                errors.push(error.errors[field].message);
            }
        }

        if (errors.length === 0) {
            errors.push(err.message);
        }

        res.status(400).json({
            errors
        });
    } else {
        next(err);
    }
});

app.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).json({
        errors: [err.message]
    });
});

const server = app.listen(port, () => {
    console.log(`Started listening on port ${port}`);
});

// Handle ^C
process.on('SIGINT', shutdown);

// Do graceful shutdown
function shutdown() {
    mongoose.disconnect().then(() => {
        server.close(() => {
            console.log('Evertyhing shutdown');
        });
    });
}

export default app;
