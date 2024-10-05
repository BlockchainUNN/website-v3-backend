export function isStrongPassword(password: string): boolean {
  // A strong password must have:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one digit
  // - At least one special character
  // - Minimum length of 8 characters
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return strongPasswordRegex.test(password);
}

export function isValidEmailAddress(email: string): boolean {
  // Using a simple regular expression to validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidRole(role: string): boolean {
  // Define valid roles
  const validRoles = ["admin", "superadmin", "event_admin", "writer", "judge"];
  return validRoles.includes(role);
}

export function isValidPhoneNumber(number: string): boolean {
  // Phone number validation: allowing numbers, spaces, and basic formatting symbols like +, -, and ()
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(number);
}
