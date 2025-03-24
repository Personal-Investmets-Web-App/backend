export class User {
  id: number;
  email: string;
  name?: string;
  lastName?: string;
  profilePic?: string;
  password?: string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CreateUserDto {
  email: string;
  name?: string;
  lastName?: string;
  profilePic?: string;
  password?: string;
  refreshToken?: string;
}

export class UpdateUserDto {
  password?: string;
  refreshToken?: string;
}
