import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { REGISTER_METHOD, ROLE, User } from '../domain/user.entities';
import { CreateUserDto } from '../domain/user.dtos';

registerEnumType(REGISTER_METHOD, {
  name: 'REGISTER_METHOD',
  description: 'The method used to register the user',
});

registerEnumType(ROLE, {
  name: 'ROLE',
  description: 'The role of the user',
});

@ObjectType()
export class UserGraphql implements User {
  @Field(() => Number)
  id: number;
  @Field(() => Date)
  createdAt: Date;
  @Field(() => Date)
  updatedAt: Date;
  @Field(() => ROLE)
  role: ROLE;

  @Field(() => String)
  email: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  lastName: string;
  @Field(() => REGISTER_METHOD)
  registerMethod: REGISTER_METHOD;

  @Field(() => String, { nullable: true })
  profilePic: string | null;
  @Field(() => String, { nullable: true })
  password: string | null;
}

@InputType()
export class CreateUserGraphqlInput implements CreateUserDto {
  @Field(() => String)
  email: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  lastName: string;
  @Field(() => REGISTER_METHOD)
  registerMethod: REGISTER_METHOD;

  @Field(() => ROLE)
  role?: ROLE;
  @Field(() => String, { nullable: true })
  profilePic?: string | null;
  @Field(() => String, { nullable: true })
  password?: string | null;
}
