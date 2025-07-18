import { Login } from "../models/dto/Login";
import { ValidationError } from "../contracts/ValidatorError";
import { IUserAccountRepository } from "../contracts/Repository/UserAccount";
import { IPasswordHasher } from "../adapter/IPasswordHasher";


export class LoginValidator {
    private readonly MAX_FIELD_LENGTH = 50;
    private readonly USERNAME_REGEX = /^[a-zA-Z0-9\s]+$/;

    constructor(private readonly repository: IUserAccountRepository, private readonly passwordHasher: IPasswordHasher) { }

    private validateUsername(username: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!username?.trim()) {
            errors.push({ field: "username", message: "Username is required" });
        } else {
            if (username.length > this.MAX_FIELD_LENGTH) {
                errors.push({ field: "username", message: `Username must be less than ${this.MAX_FIELD_LENGTH} characters` });
            }
            if (!this.USERNAME_REGEX.test(username)) {
                errors.push({ field: "username", message: "Username should not contain special characters" });
            }
        }

        return errors;
    }

    private validatePassword(password: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (!password?.trim()) {
            errors.push({ field: "password", message: "Password is required" });
        } else if (password.length > this.MAX_FIELD_LENGTH) {
            errors.push({ field: "password", message: `Password must be less than ${this.MAX_FIELD_LENGTH} characters` });
        }

        return errors;
    }

    private async validateCredentials(username: string, password: string): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];

        const user = await this.repository.IndexOf("username", username);
        if (!user) {
            errors.push({ field: "username", message: "Account does not exist" });
            return errors;
        }

        const userPwd = await this.repository.getUserPassword(username);
        if (!userPwd) {
            errors.push({ field: "password", message: "Password not set" });
        } else {
            const passwordMatch = await this.passwordHasher.compare(password, userPwd);
            if (!passwordMatch) {
                errors.push({ field: "password", message: "Invalid password" });
            }
        }

        return errors;
    }

    public async validate(login: Login): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const request = login;

        if (!request) {
            return [{ field: "username", message: "Invalid request" }];
        }

        errors.push(...this.validateUsername(request.username));
        errors.push(...this.validatePassword(request.password));

        if (errors.length === 0) {
            errors.push(...(await this.validateCredentials(request.username, request.password)));
        }
        return errors;
    }
}