export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 15; // Sync with user model column length if changed
export const MAX_EMAIL_LENGTH = 120; // Sync with user model column length if changed
export const MIN_PASSWORD_LENGTH = 8;

// Alphanumeric, underscore or dash between 3-15 inclusive
const VALID_USERNAME_REGEX: RegExp = /^[a-zA-Z0-9-_]{3,15}$/;

// Any email as long as it has a @ and . in the correct places
const VALID_EMAIL_REGEX: RegExp = /^[^@]+@[^@]+\.[^@]+$/;

// Minimum eight characters, at least one letter, one number and one special character:
// https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
// TODO: Use a library
const VALID_PASSWORD_REGEX: RegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export const USERNAME_REQUIREMENT_MESSAGE = 'Username must be between 3-15 characters, and may only contains letters, numbers, dashes(-) and underscores(_)';
export const PASSWORD_REQUIREMENT_MESSAGE = 'Passwords must at least 8 characters, with at least one letter, number and special character';

export function validateUsername(username: string): boolean {
  // Check if RE matches
  if (!username || !VALID_USERNAME_REGEX.test(username)) {
    return false;
  }
  return true;
}

export function validateEmail(email: string): boolean {
  // Check if RE matches
  if (!email || !VALID_EMAIL_REGEX.test(email)) {
    return false;
  }
  // Check length
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  return true;
}

export function validatePassword(password: string): boolean {
  // Check if RE matches
  if (!password || !VALID_PASSWORD_REGEX.test(password)) {
    return false;
  }
  return true;
}
