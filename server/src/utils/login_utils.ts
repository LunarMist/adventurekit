export const MinUsernameLength = 3;
export const MaxUsernameLength = 15;
export const MaxEmailLength = 120; // Sync with user model column length if changed
export const MinPasswordLength = 8;

// Alphanumeric, underscore or dash between 3-15 inclusive
const ValidUsernameRegEx: RegExp = /^[a-zA-Z0-9-_]{3,15}$/;

// Any email as long as it has a @ and . in the correct places
const ValidEmailRegEx: RegExp = /^[^@]+@[^@]+\.[^@]+$/;

// Minimum eight characters, at least one letter, one number and one special character:
// https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
// TODO: User a library
const ValidPasswordRegEx: RegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export function validateUsername(username: string): boolean {
  // Check if RE matches
  if (!username || !ValidUsernameRegEx.test(username)) {
    return false;
  }
  // TODO: Check for duplicates and return better error message
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
  // TODO: Check for duplicates and return better error message
  return true;
}

export function validatePassword(password: string): boolean {
  // Check if RE matches
  if (!password || !ValidPasswordRegEx.test(password)) {
    return false;
  }
  return true;
}
