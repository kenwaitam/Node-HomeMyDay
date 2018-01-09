import express = require('express');
import accommodationRoutes from './accommodation.routes';
import authenticationRoutes from './authentication.routes';

const router = express.Router();

router.use('/authentication', authenticationRoutes);
router.use('/accommodations', accommodationRoutes);

export default router;
