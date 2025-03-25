export class User {
  id: number;
  email: string;
  name: string | null;
  lastName: string | null;
  profilePic: string | null;
  password: string | null;
  refreshToken: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
