import express = require('express');
import accommodationRoutes from './accommodation.routes';
import routesAuthentication from './authentication.routes';

const router = express.Router();

router.use('/authentication', routesAuthentication);
router.use('/accommodations', accommodationRoutes);

export default router;
