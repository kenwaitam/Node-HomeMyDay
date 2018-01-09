import * as bcrypt from 'bcrypt';
import { Document, Schema } from 'mongoose';
import uniqueValidator = require('mongoose-unique-validator');

export interface IUserDocument extends Document {
    email: string;
    password: string;
    role: UserRoles;
}

export enum UserRoles {
    User = 'User',
    Administrator = 'Administrator'
}

const userSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: UserRoles.User
    }
});

/* tslint:disable */
userSchema.pre('save', async function(next) {
    
/* tslint:enable */

    const user = this;

    try {
        if (this.isModified('password') || this.isNew) {
            // Hash the user's password for 10 rounds
            const hash = await bcrypt.hash(user.password, 10);
            user.password = hash;
        }
    } catch (e) {
        next(e);
        return;
    }

    next();
});

/* tslint:disable */
userSchema.methods.comparePassword = function (password) {
/* tslint:enable */
    return bcrypt.compare(password, this.password);
};

// Prevent password or password hash from being serialized
userSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret, options) => {
        delete ret.password;
        return ret;
    }
});

userSchema.plugin(uniqueValidator);

export const UserSchema = userSchema;
