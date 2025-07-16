
export interface IResponse<T> {
    data: T[] | T | null;
    message: string;
    success: boolean;
}
