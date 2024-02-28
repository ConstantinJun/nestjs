import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersSerivce: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersSerivce = {
      find: (email: string) => {
        const filteredUser = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUser);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 9999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersSerivce },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('test@email.com', '123');
    const [salt, hash] = user.password.split('.');

    expect(user.password).not.toEqual('123');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('test@email.com', '123');

    await expect(service.signup('test@email.com', '123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('123123@email.com', '123123123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('test@email.com', '123123');
    await expect(service.signin('test@email.com', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('return a uer if correct password is provided', async () => {
    await service.signup('test@email.com', 'mypassword');

    const user = await service.signin('test@email.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
