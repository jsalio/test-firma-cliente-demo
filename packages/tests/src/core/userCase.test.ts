import { User, UserWithoutPwd } from "@sample-mono/core/src/models/db/user";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { IGenericRepository } from "@sample-mono/core/src/contracts/IGenericRepositrory";
import { IGenericRequest } from "@sample-mono/core/src/contracts/IGenericRequest";
import { Login } from "@sample-mono/core/src/models/dto/Login";
import { LoginUsers } from "@sample-mono/core/src/usecases/LoginUsers";

describe('test user login use case', () => {


    const mockRepository: IGenericRepository<User, UserWithoutPwd> = {
        save: vi.fn(),
        update: vi.fn(),
        Select: vi.fn(),
        FindOne: vi.fn(),
        Delete: vi.fn(),
        IndexOf: vi.fn(),
      };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockBuild = vi.fn();
    const mockRequest: IGenericRequest<Login> = { build: mockBuild };

    test('When request is null should fail',()=>{
        mockBuild.mockReturnValue(null)
        expect(mockRequest.build()).toBeNull();
        expect(mockBuild).toHaveBeenCalled();
    })

    test('When request is not null should pass',()=>{
        const login: Login = { username: 'test', password: '123' };
        mockBuild.mockReturnValue(login);
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();
    })

    test('When create user case with should success', ()=>{
        mockBuild.mockReturnValue(null)
        expect(mockRequest.build()).toBeNull();
        expect(mockBuild).toHaveBeenCalled();

        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)
    })

    test('when pass a null request to case should fail',async () => {
        mockBuild.mockReturnValue(null)
        expect(mockRequest.build()).toBeNull();
        expect(mockBuild).toHaveBeenCalled();

        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)

        let validations :Array<string> = await loginusr.validate()

        expect(validations).length(1)
        expect(validations).contain('Invalid request')
    })

    test('When username is empty should fail', async ()=> {
        const login: Login = { username: '', password: '123' };
        mockBuild.mockReturnValue(login); // Cambia el valor retornado
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        let loginusr = new LoginUsers(mockRequest,mockRepository)
        expect(loginusr).instanceof(LoginUsers)

        let validations :Array<string> = await loginusr.validate()

        expect(validations).length(1)
        expect(validations).contain('Username is required')
    })

    test('When password is empty should fail',async ()=> {
        const login: Login = { username: 'testuser', password: '' };
        mockBuild.mockReturnValue(login); // Cambia el valor retornado
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)

        let validations :Array<string> = await loginusr.validate()

        expect(validations).length(2)
        expect(validations).contain('Password is required')
    })

    test('When username not exists should fail', async ()=>{
        const login: Login = { username: '1234', password: '123' };
        mockBuild.mockReturnValue(login);
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        mockRepository.IndexOf = vi.fn().mockImplementation((field: keyof User, value: any) => {
            return false
        })

        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)

        let validations :Array<string> = await loginusr.validate()
        console.log(validations)

        expect(validations).length(1)
        expect(validations).contain('Account does not exist')
    })

    test('When Pass all correct check should pass', async()=> {
        const login: Login = { username: 'testuser', password: '123' };
        mockBuild.mockReturnValue(login); // Cambia el valor retornado
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        mockRepository.IndexOf = vi.fn().mockImplementation((field: keyof User, value: any) => {
            return true
        })

        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)

        let validations :Array<string> = await loginusr.validate()

        expect(validations).length(0)
    })

    test('Execute fail', async()=>{
        const login: Login = { username: 'testuserx', password: '123' };
        mockBuild.mockReturnValue(login);
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        mockRepository.IndexOf = vi.fn().mockImplementation((field: keyof User, value: any) => {
            return true
        })

        mockRepository.FindOne = vi.fn().mockImplementation((field: keyof User, value: any) => {
            throw new Error("Error occurs")
        })
    
        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof(LoginUsers)
    
        let validations :Array<string> = await loginusr.validate()
        expect(validations).length(0)
    
        let result = await loginusr.execute()
    
        // Use toEqual for deep equality check instead of equal
        expect(result).toEqual({
            success: false,
            data: null,
            message: "Error occurs"
        })
    })

    test('Execute Pass', async ()=>{
        const login: Login = { username: 'testuser', password: '123' };
        mockBuild.mockReturnValue(login);
        expect(mockRequest.build()).toEqual(login);
        expect(mockBuild).toHaveBeenCalled();

        mockRepository.IndexOf = vi.fn().mockImplementation((field: keyof User, value: any) => {
            return true
        })

        mockRepository.FindOne = vi.fn().mockImplementation((field: keyof User, value: any) => {
            if (field === 'username' && value === 'testuser') {
                return { 
                    data: { 
                        Id: '1', 
                        username: 'testuser', 
                        active: true, 
                        password: '123', 
                        email: 'test@example.com', 
                        createdAt: new Date('2025-06-06') 
                    } 
                };
            }
            return { data: null, error: 'User not found' };
        });
    
        let loginusr = new LoginUsers(mockRequest, mockRepository)
        expect(loginusr).instanceof (LoginUsers)
    
        let validations :Array<string> = await loginusr.validate()
        expect(validations).length(0)
    
        let result = await loginusr.execute()
    
        // Use toEqual for deep equality check instead of equal
        expect(result).toEqual({
            success: true,
            data: { 
                Id: '1', 
                username: 'testuser', 
                active: true, 
                email: 'test@example.com', 
                createdAt: expect.any(Date)  // Use expect.any(Date) to match any Date object
            },
            message: ''
        })
    })

});