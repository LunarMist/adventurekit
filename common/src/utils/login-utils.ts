export const MinUsernameLength = 3;
export const MaxUsernameLength = 15; // Sync with user model column length if changed
export const MaxEmailLength = 120; // Sync with user model column length if changed
export const MinPasswordLength = 8;

// Alphanumeric, underscore or dash between 3-15 inclusive
const ValidUsernameRegEx: RegExp = /^[a-zA-Z0-9-_]{3,15}$/;

// Any email as long as it has a @ and . in the correct places
const ValidEmailRegEx: RegExp = /^[^@]+@[^@]+\.[^@]+$/;

// Minimum eight characters, at least one letter, one number and one special character:
// https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
// TODO: Use a library
const ValidPasswordRegEx: RegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export const UsernameRequirementMessage = 'Username must be between 3-15 characters, and may only contains letters, numbers, dashes(-) and underscores(_)';
export const PasswordRequirementMessage = 'Passwords must at least 8 characters, with at least one letter, number and special character';

export function validateUsername(username: string): boolean {
  // Check if RE matches
  if (!username || !ValidUsernameRegEx.test(username)) {
    return false;
  }
  return true;
}

export function validateEmail(email: string): boolean {
  // Check if RE matches
  if (!email || !ValidEmailRegEx.test(email)) {
    return false;
  }
  // Check length
  if (email.length > MaxEmailLength) {
    return false;
  }
  return true;
}

export function validatePassword(password: string): boolean {
  // Check if RE matches
  if (!password || !ValidPasswordRegEx.test(password)) {
    return false;
  }
  return true;
}
