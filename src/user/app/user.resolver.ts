import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserGraphqlInput, UserGraphql } from '../infra/user.models';
import { UserService } from './user.service';
import { Public } from 'src/auth/app/decorators/public.decorator';

@Resolver(() => UserGraphql)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserGraphql], { name: 'getAllUsers' })
  @Public()
  async findAll() {
    const result = await this.userService.getAllUsers();

    if (result.isErr()) {
      throw new Error(result.error.type);
    }
    return result.value;
  }

  @Mutation(() => UserGraphql)
  createUser(@Args('createUserInput') createUserInput: CreateUserGraphqlInput) {
    return this.userService.createUser(createUserInput);
  }
}
