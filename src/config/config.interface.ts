export interface IConfig {
    /**
     * The default port the server listens on
     */
    port: number;

    /**
     * The default connection to mongodb if none other was specified
     */
    mongoDbUri: string;

    /**
     * The origin that is allowed access to the api
     */
    allowOrigin: string;

    /**
     * The default secret key used for JWT authentication
     */
    secret: string;

    /**
     * How many seconds a JWT token is valid
     */
    expirationSeconds: number;
}
