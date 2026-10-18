export interface PasswordEvaluation {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  criteriaCount: number;
  strengthLabel: string;
  strengthColor: string;
  strengthPercent: number;
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  if (criteriaCount === 0) {
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      criteriaCount,
      strengthLabel: "",
      strengthColor: "transparent",
      strengthPercent: 0,
    };
  }

  if (criteriaCount <= 2) {
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      criteriaCount,
      strengthLabel: "Weak",
      strengthColor: "#ef4444",
      strengthPercent: 25,
    };
  }

  if (criteriaCount === 3) {
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      criteriaCount,
      strengthLabel: "Fair",
      strengthColor: "#f59e0b",
      strengthPercent: 60,
    };
  }

  if (criteriaCount === 4) {
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      criteriaCount,
      strengthLabel: "Good",
      strengthColor: "#6366f1",
      strengthPercent: 80,
    };
  }

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    criteriaCount,
    strengthLabel: "Strong",
    strengthColor: "#10b981",
    strengthPercent: 100,
  };
}

export function validateSignUpFields(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  evaluation: PasswordEvaluation,
): string | null {
  if (!name.trim()) {
    return "Please enter your name.";
  }
  if (!email.trim()) {
    return "Please enter your email address.";
  }
  if (!evaluation.hasMinLength) {
    return "Password must be at least 8 characters long.";
  }
  if (!evaluation.hasUppercase) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (!evaluation.hasLowercase) {
    return "Password must contain at least one lowercase letter (a-z).";
  }
  if (!evaluation.hasNumber) {
    return "Password must contain at least one number (0-9).";
  }
  if (!evaluation.hasSpecial) {
    return "Password must contain at least one special character (e.g. !@#$%^&*).";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match. Please verify your confirm password.";
  }
  return null;
}
