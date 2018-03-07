// import ExpressBrute = require('express-brute');
import * as ExpressBrute from 'express-brute';
import * as MemcachedStore from 'express-brute-memcached';
import * as moment from 'moment';
import { log } from 'util';
// import MemcachedStore = require('express-brute-memcached');

export class BruteMiddleware {

    public static Store() {
        let store;

        return store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production

        // if (process.env.NODE_ENV === 'development') {
        //     return store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
        // } else {
        //     // stores state with memcached
        //     return store = new MemcachedStore(['127.0.0.1:3000'], {
        //         prefix: 'NoConflicts'
        //     });
        // }
    }

    public static userBruteforce() {
        // Start slowing requests after 5 failed attempts to do something for the same user
        return new ExpressBrute(this.Store(), {
            freeRetries: 5,
            minWait: 1 * 60 * 1000, // 1 minutes
            maxWait: 10 * 60 * 1000, // 10 min
        });
    }

    public static globalBruteforce() {
        // No more than 10000 login attempts per day per IP
        return new ExpressBrute(this.Store(), {
            freeRetries: 10000,
            attachResetToRequest: false,
            refreshTimeoutOnRequest: false,
            minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
            maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
            lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
            failCallback: this.failCallback,
            handleStoreError: this.handleStoreError
        });
    }

    public static failCallback(req, res, next, nextValidRequestDate) {
        req.flash('error', 'You\'ve made too many failed attempts in a short period of time, please try again '
            + moment(nextValidRequestDate).fromNow());
        res.redirect('/login'); // brute force protection triggered, send them back to the login page
    }

    public static handleStoreError(error) {
        // log.error(error); // log this error so we can figure out what went wrong
        // cause node to exit, hopefully restarting the process fixes the problem
        throw {
            message: error.message,
            parent: error.parent
        };
    }
}
