import { User, UserWithoutPwd } from "@sample-mono/core/src/models/db/user";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IGenericRepository } from "@sample-mono/core/src/contracts/IGenericRepositrory";
import { IGenericRequest } from "@sample-mono/core/src/contracts/IGenericRequest";
import { Login } from "@sample-mono/core/src/models/dto/Login";
import { LoginUsers } from "@sample-mono/core/src/usecases/LoginUsers";

describe('LoginUsers Use Case', () => {
    let mockRepository: IGenericRepository<User, UserWithoutPwd>;
    let mockBuild: any;
    let mockRequest: IGenericRequest<Login>;
    let validUser: UserWithoutPwd;
    let validLogin: Login;

    // Setup common test data and mocks
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Initialize test data
        validUser = {
            Id: '1',
            username: 'testuser',
            active: true,
            email: 'test@example.com',
            createdAt: new Date('2025-06-06')
        };

        validLogin = {
            username: 'testuser',
            password: '123'
        };

        // Setup repository mock
        mockRepository = {
            save: vi.fn(),
            update: vi.fn(),
            Select: vi.fn(),
            FindOne: vi.fn(),
            Delete: vi.fn(),
            IndexOf: vi.fn(),
        };

        // Setup request mock
        mockBuild = vi.fn<[void], Login | null>(() => null);
        mockRequest = { build: mockBuild };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('should create instance successfully', () => {
            const loginUser = new LoginUsers(mockRequest, mockRepository);
            expect(loginUser).toBeInstanceOf(LoginUsers);
        });
    });

    describe('Request Validation', () => {
        test('should fail when request is null', async () => {
            // Arrange
            mockBuild.mockReturnValue(null);
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Invalid request');
        });

        test('should fail when username is empty', async () => {
            // Arrange
            const login: Login = { username: '', password: '123' };
            mockBuild.mockReturnValue(login);
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Username is required');
        });

        test('should fail when password is empty', async () => {
            // Arrange
            const login: Login = { username: 'testuser', password: '' };
            mockBuild.mockReturnValue(login);
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(2);
            expect(validations).toContain('Password is required');
        });

        test('should fail when username does not exist', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(false);
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Account does not exist');
            expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', validLogin.username);
        });

        test('should pass when all validations pass', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(0);
        });
    });

    describe('Execute', () => {
        test('should handle execution failure', async () => {
            // Arrange
            const errorMessage = 'Database error';
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.FindOne = vi.fn().mockRejectedValue(new Error(errorMessage));
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const result = await loginUser.execute();

            // Assert
            expect(result).toEqual({
                success: false,
                data: null,
                message: errorMessage
            });
        });

        test('should execute successfully with valid credentials', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.FindOne = vi.fn().mockResolvedValue({ data: { ...validUser, password: '123' } });
            const loginUser = new LoginUsers(mockRequest, mockRepository);

            // Act
            const result = await loginUser.execute();

            // Assert
            expect(result).toEqual({
                success: true,
                data: expect.objectContaining({
                    Id: '1',
                    username: 'testuser',
                    active: true,
                    email: 'test@example.com',
                    createdAt: expect.any(Date)
                }),
                message: 'Login successful'
            });
            expect(mockRepository.FindOne).toHaveBeenCalledWith('username', validLogin.username);
        });
    });
});