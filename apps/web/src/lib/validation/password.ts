interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  return {
    isValid: hasMinLength && hasUppercase && hasNumber,
    hasMinLength,
    hasUppercase,
    hasNumber,
  };
}
