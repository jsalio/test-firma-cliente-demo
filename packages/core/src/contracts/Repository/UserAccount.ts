import { User, UserWithoutPwd } from "../../models/db/user";
import { IGenericRepository } from "./IGenericRepositrory";

/**
 * Interface for user account repository operations.
 * Extends the generic repository interface to provide user-specific data access methods.
 * Handles operations for user entities while ensuring sensitive data (like passwords) is managed appropriately.
 * 
 * @interface IUserAccountRepository
 * @extends {IGenericRepository<User, UserWithoutPwd>}
 */
export interface IUserAccountRepository extends IGenericRepository<User, UserWithoutPwd> {
    /**
     * Retrieves the hashed password for a user by their username.
     * 
     * @param username - The username of the user whose password is to be retrieved.
     * @returns A promise that resolves to the hashed password string or null if the user is not found or no password is set.
     */
    getUserPassword(username: string): Promise<string | null>;
}