import { registerEnumType } from "@nestjs/graphql";

export enum Message {
  SOMETHING_WENT_WRONG = 'Something went wrong!',
  NO_DATA_FOUND = 'No data found!',
  CREATE_FAILED = 'Create failed!',
  UPDATE_FAILED = 'Update failed!',
  REMOVE_FAILED = 'Remove failed!',
  UPLOAD_FAILED = 'Upload failed!',
  BAD_REQUEST = 'Bad Request!',

  USED_MEMBER_NICK_OR_PHONE = 'Already used member nick or phone!',
  USED_MEMBER_NICK = 'This nickname is already used.',
  USED_MEMBER_PHONE = 'This phone number is already registered.',
  USED_MEMBER_EMAIL = 'This email is already registered.',
  INVALID_MEMBER_NICK = 'Use 3–20 letters, numbers, hyphen, or underscore.',
  INVALID_MEMBER_PASSWORD = 'Use at least 8 characters.',
  INVALID_MEMBER_PHONE = 'Enter a valid phone number, including country code.',
  CREATE_ACCOUNT_FAILED = 'Could not create account. Please try again.',
  NO_MEMBER_NICK = 'No member with that member nick!',
  BLOCKED_USER = 'You have been blocked!',
  WRONG_PASSWORD = 'Wrong password, try again!',
  NOT_AUTHENTICATED = 'You are not authenticated, please login first!',
  TOKEN_NOT_EXIST = 'Bearer Token is not provided!',
  ONLY_SPECIFIC_ROLES_ALLOWED = 'Allowed only for members with specific roles!',
  NOT_ALLOWED_REQUEST = 'Not Allowed Request!',
  PROVIDE_ALLOWED_FORMAT = 'Please provide jpg, jpeg, png or webp images!',
  SELF_SUBSCRIPTION_DENIED = 'Self subscription is denied!',
}

export enum Direction {
  ASC = 1,
  DESC = -1,
}

registerEnumType(Direction, {
  name: 'Direction',
});
