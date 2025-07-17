import { User, UserWithoutPwd } from "../../models/db/user";
import { IGenericRepository } from "./IGenericRepositrory";


export interface IUserAccountRepository extends IGenericRepository<User, UserWithoutPwd> {
    getUserPassword(username: string): Promise<string | null>;
}