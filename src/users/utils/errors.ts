export class UserAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'USER_ALREADY_EXISTS_ERROR';
  }
}

export class DBError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DB_ERROR';
  }
}

export class UserCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'USER_CREATION_ERROR';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'USER_NOT_FOUND_ERROR';
  }
}
export class UserUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'USER_UPDATE_ERROR';
  }
}
export class UserDeletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'USER_DELETION_ERROR';
  }
}
