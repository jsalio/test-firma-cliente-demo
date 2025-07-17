import { IResponse } from "../IResponse";

/**
 * Base repository interface defining common CRUD operations
 * @template T The entity type for input operations
 * @template R The return type (usually the same as T or a subset of T)
 */
export interface IGenericRepository<T, R> {
    /**
     * Saves an entity
     * @param data The entity data to save
     * @returns Response with the saved entity or error
     */
    save(data: T): Promise<IResponse<R>>;
    
    /**
     * Updates an existing entity
     * @param data The entity data with updates
     * @returns Response with the updated entity or error
     */
    update(data: T): Promise<IResponse<R>>;
    
    /**
     * Finds entities by a specific field
     * @param field The field to search by
     * @param value The value to match
     * @returns Response with array of matching entities or error
     */
    Select(field: keyof T, value: T[keyof T]): Promise<IResponse<Array<R>>>;
    
    /**
     * Finds a single entity by a specific field
     * @param field The field to search by
     * @param value The value to match
     * @returns Response with the found entity or error
     */
    FindOne(field: keyof T, value: T[keyof T]): Promise<IResponse<R>>;
    
    /**
     * Deletes an entity by its ID
     * @param field The ID of the entity to delete
     */
    Delete(field: string): Promise<void>;

    /**
     * Checks if an entity exists based on a field and value
     * @param field The field to search by
     * @param value The value to match
     * @returns True if the entity exists, false otherwise
     */
    IndexOf(field: keyof T, value: T[keyof T]): Promise<boolean>;
}


