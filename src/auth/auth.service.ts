import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { errAsync, okAsync } from 'neverthrow';
import { CreateUserDto } from 'src/users/users.models';

export class UserHasNoPasswordError extends Error {}
export class UserPasswordIsInvalidError extends Error {}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUserWithPassword(email: string, pass: string) {
    const user = await this.usersService.getUserFromDbByEmail(email);
    if (user.isErr()) {
      return errAsync(user.error);
    }

    if (!user.value.password) {
      Logger.error('User has no password');
      return errAsync(new UserHasNoPasswordError());
    }

    const isPasswordValid = await compare(pass, user.value.password);
    if (!isPasswordValid) {
      Logger.error('User password is invalid');
      return errAsync(new UserPasswordIsInvalidError());
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.value;
    return okAsync(result);
  }

  async validateUser(email: string) {
    const user = await this.usersService.getUserFromDbByEmail(email);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }

  loginWithPassword(email: string, id: number) {
    const payload = { username: email, sub: id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.createUserInDb(createUserDto);
    if (user.isErr()) {
      return errAsync(user.error);
    }
    return okAsync(user.value);
  }
}
