import { Config } from '../config/config.const';
import { IUserModel } from '../model/user.model';

const jwt = require('jsonwebtoken');

export class AuthenticationService {

    /**
     * Generates a token for a string.
     * @param str The string to generate a token for.
     * @returns A JWT token in string form.
     */
    public static generateToken(str: string): string {

        const token = jwt.sign({value: str}, Config.secret, {
            expiresIn: Config.expirationSeconds
        });

        return token;
    }

    /**
     * Decodes a token and returns it in string form.
     * @param token The token to decode.
     */
    public static decodeToken(token: string): string {
        const obj = jwt.verify(token, Config.secret);
        return obj.value;
    }
}
