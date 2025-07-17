import { IGenericRequest } from "../contracts/IGenericRequest";
import { Login } from "../models/dto/Login";
import { UserWithoutPwd } from "../models/db/user";
import { IResponse } from "../contracts/IResponse";
import { IUserAccountRepository } from "../contracts/Repository/UserAccount";
import { IPasswordHasher } from "../adapter/IPasswordHasher";

const MAX_FIELD_LENGTH = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9\s]+$/;

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Handles user login operations including validation and authentication.
 */
export class LoginUsers {
  constructor(
    private readonly request: IGenericRequest<Login>,
    private readonly repository: IUserAccountRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  /**
   * Validates the login request credentials.
   * @returns Array of validation errors, empty if validation passes
   */
  public async validate(): Promise<string[]> {
    const errors: ValidationError[] = [];
    const request = this.request.build();

    if (!request) {
      return ["Invalid request"];
    }

    errors.push(...this.validateUsername(request.username));
    errors.push(...this.validatePassword(request.password));

    if (errors.length === 0) {
      errors.push(...(await this.validateCredentials(request.username, request.password)));
    }

    return errors.map(x => x.message);
  }

  private validateUsername(username: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!username?.trim()) {
      errors.push({ field: "username", message: "Username is required" });
    } else {
      if (username.length > MAX_FIELD_LENGTH) {
        errors.push({ field: "username", message: `Username must be less than ${MAX_FIELD_LENGTH} characters` });
      }
      if (!USERNAME_REGEX.test(username)) {
        errors.push({ field: "username", message: "Username should not contain special characters" });
      }
    }

    return errors;
  }

  private validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!password?.trim()) {
      errors.push({ field: "password", message: "Password is required" });
    } else if (password.length > MAX_FIELD_LENGTH) {
      errors.push({ field: "password", message: `Password must be less than ${MAX_FIELD_LENGTH} characters` });
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

  /**
   * Executes the login process and returns user data.
   * @returns Response object containing login result
   */
  public async execute(): Promise<IResponse<UserWithoutPwd>> {
    const request = this.request.build();
    if (!request?.username) {
      return {
        success: false,
        data: null,
        message: "Invalid request: username is required"
      };
    }

    try {
      const result = await this.repository.FindOne("username", request.username);
      const data = result.data as UserWithoutPwd;

      return {
        success: true,
        data: {
          Id: data.Id,
          username: data.username,
          email: data.email,
          active: data.active,
          createdAt: data.createdAt
        },
        message: "Login successful"
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : "An unexpected error occurred during login"
      };
    }
  }
}