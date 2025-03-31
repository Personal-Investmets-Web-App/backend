import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
} from '../domain/user.dtos';
import { SerializeOutput } from 'src/shared/app/decorators/serialize-controller';
import { UserProfileSchema, UserProfile, ROLE } from '../domain/user.entities';
import { BodyValidationGuard } from 'src/shared/app/guards/validate-body.guard';
import { Roles } from 'src/auth/app/decorators/roles.decorator';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @SerializeOutput(UserProfileSchema)
  async findAll(): Promise<UserProfile[]> {
    const result = await this.userService.getAllUsers();
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Get('id/:id')
  @SerializeOutput(UserProfileSchema)
  async findById(@Param('id') id: number): Promise<UserProfile> {
    const result = await this.userService.getUserById(id);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Get('email/:email')
  @SerializeOutput(UserProfileSchema)
  async findByEmail(@Param('email') email: string): Promise<UserProfile> {
    const result = await this.userService.getUserByEmail(email);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Post()
  @UseGuards(new BodyValidationGuard(CreateUserSchema))
  @SerializeOutput(UserProfileSchema)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserProfile> {
    const result = await this.userService.createUser(createUserDto);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Put('id/:id')
  @UseGuards(new BodyValidationGuard(UpdateUserSchema))
  @SerializeOutput(UserProfileSchema)
  async updateById(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfile> {
    const result = await this.userService.updateUserById(id, updateUserDto);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Put('email/:email')
  @UseGuards(new BodyValidationGuard(UpdateUserSchema))
  @SerializeOutput(UserProfileSchema)
  async updateByEmail(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfile> {
    const result = await this.userService.updateUserByEmail(
      email,
      updateUserDto,
    );
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Delete('id/:id')
  @Roles(ROLE.ADMIN, ROLE.EDITOR)
  @SerializeOutput(UserProfileSchema)
  async deleteById(@Param('id') id: number): Promise<UserProfile> {
    const result = await this.userService.deleteUserById(id);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }

  @Delete('email/:email')
  @Roles(ROLE.ADMIN, ROLE.EDITOR)
  @SerializeOutput(UserProfileSchema)
  async deleteByEmail(@Param('email') email: string): Promise<UserProfile> {
    const result = await this.userService.deleteUserByEmail(email);
    if (result.isErr()) {
      throw new HttpException(
        result.error.type,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result.value;
  }
}
