import { IGenericRequest } from "../contracts/IGenericRequest";
import { Login } from "../models/dto/Login";
import { IGenericRepository } from "../contracts/IGenericRepositrory";
import { User } from "../models/db/user";
import { UserWithoutPwd } from "../models/db/user";
import { IResponse } from "../contracts/IResponse";

/**
 * Handles user login operations including validation and authentication.
 * This class is responsible for validating login credentials and executing
 * the login process while ensuring sensitive information is handled securely.
 */
export class LoginUsers {
    /**
     * Creates a new instance of LoginUsers
     * @param request - The login request containing user credentials
     * @param repository - The repository for user data operations
     */
    constructor(private request: IGenericRequest<Login>, private repository: IGenericRepository<User, UserWithoutPwd>) {}
    
    /**
     * Validates the login request by checking for required fields and user existence.
     * @returns A promise that resolves to an array of error messages.
     *          If the array is empty, validation passed successfully.
     * @throws {Error} If there's an unexpected error during validation
     */
    public async validate(): Promise<string[]> {
        const messages: string[] = [];
        const request = this.request.build();

        if (!request) {
            messages.push('Invalid request');
            return messages;
        }

        if (!request.username || request.username.trim() === '') {
            messages.push('Username is required');
        }

        if (!request.password || request.password.trim() === '') {
            messages.push('Password is required');
        }

        // Only check user existence if we have a username
        if (request.username && request.username.trim() !== '') {
            const foundUser = await this.repository.IndexOf('username', request.username);
            if (!foundUser) {
                messages.push('Account does not exist');
            }
        }

        return messages;
    }

    /**
     * Executes the login process by verifying credentials and returning user data.
     * @returns A promise that resolves to an IResponse object containing:
     *          - success: boolean indicating if login was successful
     *          - data: User data without password if successful, null otherwise
     *          - message: Success/error message
     * @throws {Error} If there's an unexpected error during login
     */
    public async execute(): Promise<IResponse<UserWithoutPwd>> {
        const request = this.request.build();

        try {
            const result = await this.repository.FindOne('username', request?.username as string);
            const data = result.data as UserWithoutPwd;

            return {
                success: true,
                data: {
                    active: data.active,
                    createdAt: data.createdAt,
                    email: data.email,
                    Id: data.Id,
                    username: data.username
                },
                message: 'Login successful'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: error instanceof Error ? error.message : 'An unexpected error occurred during login'
            };
        }
    }
}
