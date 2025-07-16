export type User = {
    id: string;
    username: string;
    password: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Represents a user without sensitive password information.
 * This type is typically used when returning user data to the client.
 */
export type UserWithoutPwd = {
    /** Unique identifier for the user */
    Id: string;
    
    /** User's email address */
    email: string;
    
    /** User's unique username */
    username: string;
    
    /** Whether the user account is active */
    active: boolean;
    
    /** Date and time when the user was created */
    createdAt: Date;
};