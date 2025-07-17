import { User, UserWithoutPwd } from "@sample-mono/core/src/models/db/user";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { IGenericRequest } from "@sample-mono/core/src/contracts/IGenericRequest";
import { Login } from "@sample-mono/core/src/models/dto/Login";
import { LoginUsers } from "@sample-mono/core/src/usecases/LoginUsers";
import { IUserAccountRepository } from "@sample-mono/core/src/contracts/Repository/UserAccount";
import { IPasswordHasher } from "@sample-mono/core/src/adapter/IPasswordHasher";

describe('LoginUsers Use Case', () => {
    let mockRepository: IUserAccountRepository;
    let mockBuild: any;
    let mockRequest: IGenericRequest<Login>;
    let validUser: UserWithoutPwd;
    let validLogin: Login;
    let validPassword: string;
    let mockPasswordHasher: IPasswordHasher;        

    // Setup common test data and mocks
    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        mockPasswordHasher = {
            hash: vi.fn(),
            compare: vi.fn(),
        };

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

        validPassword = '123';

        // Setup repository mock
        mockRepository = {
            save: vi.fn(),
            update: vi.fn(),
            Select: vi.fn(),
            FindOne: vi.fn(),
            Delete: vi.fn(),
            IndexOf: vi.fn(),
            getUserPassword: vi.fn(),
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
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);
            expect(loginUser).toBeInstanceOf(LoginUsers);
        });
    });

    describe('Request Validation', () => {
        test('should fail when request is null', async () => {
            // Arrange
            mockBuild.mockReturnValue(null);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher); 

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
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Username is required');
        });

        
        test('should fail when username does not exist', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(false);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);
            
            // Act
            const validations = await loginUser.validate();
            
            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Account does not exist');
            expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', validLogin.username);
        });

        test("When username contains spacial charaters should fail", async () => {
            mockBuild.mockReturnValue({ username: 'testuser!', password: '123' });
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);

            mockRepository.getUserPassword = vi.fn().mockResolvedValue(validPassword);
            mockPasswordHasher.compare = vi.fn().mockResolvedValue(true);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);
            
            // Act
            const validations = await loginUser.validate();
            
            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Username should not contain special characters');
            //expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', 'testuser!');
        })
        
        test("when username lenght is greath than 50 should fail", async () => {
            // Arrange
            const login: Login = { username: 'testuser'.repeat(10), password: '123' };
            mockBuild.mockReturnValue(login);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(validPassword);
            mockPasswordHasher.compare = vi.fn().mockResolvedValue(true);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Username must be less than 50 characters');
        })

        test('should fail when password is empty', async () => {
            // Arrange
            const login: Login = { username: 'testuser', password: '' };
            mockBuild.mockReturnValue(login);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Password is required');
        });

        test("when password lenght is greath than 50 should fail", async () => {
            // Arrange
            const login: Login = { username: 'testuser', password: '123'.repeat(20) };
            mockBuild.mockReturnValue(login);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(validPassword);
            mockPasswordHasher.compare = vi.fn().mockResolvedValue(true);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Password must be less than 50 characters');
        })

        test('should fail when password is not set', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(null);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Password not set');
            expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', validLogin.username);
            expect(mockRepository.getUserPassword).toHaveBeenCalledWith(validLogin.username);
        });

        test('should fail when password is not set', async () => {
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(null);

            mockPasswordHasher.compare = vi.fn().mockResolvedValue(false);

            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Password not set');
            expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', validLogin.username);
            expect(mockRepository.getUserPassword).toHaveBeenCalledWith(validLogin.username);
        })

        test("When password storage not match with user password should fail", async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(validPassword);

            mockPasswordHasher.compare = vi.fn().mockResolvedValue(false);

            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

            // Act
            const validations = await loginUser.validate();

            // Assert
            expect(validations).toHaveLength(1);
            expect(validations).toContain('Invalid password');
            expect(mockRepository.IndexOf).toHaveBeenCalledWith('username', validLogin.username);
            expect(mockRepository.getUserPassword).toHaveBeenCalledWith(validLogin.username);
            expect(mockPasswordHasher.compare).toHaveBeenCalledWith(validLogin.password, validPassword);
        })

        test('should pass when all validations pass', async () => {
            // Arrange
            mockBuild.mockReturnValue(validLogin);
            mockRepository.IndexOf = vi.fn().mockResolvedValue(true);
            mockPasswordHasher.compare = vi.fn().mockResolvedValue(true);
            mockRepository.getUserPassword = vi.fn().mockResolvedValue(validPassword);
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

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
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

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
            const loginUser = new LoginUsers(mockRequest, mockRepository, mockPasswordHasher);

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