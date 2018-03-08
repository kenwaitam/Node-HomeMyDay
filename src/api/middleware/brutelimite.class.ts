import * as express from 'express';
import * as RateLimit from 'express-rate-limit';

export class BruteForce {
    public static limiter() {
        return new RateLimit({
            windowMs: 2 * 60 * 1000, // 2 minutes
            max: 5,
            delayMs: 0, // disabled
            // skipFailedRequests: true
        }
        );
    }

}
