"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerWithCredentials } from "@/lib/api-client";
import {
  PasswordInput,
  PasswordStrengthMeter,
  PasswordCriteriaChecklist,
  PasswordMatchBadge,
} from "./PasswordValidationComponents";
import { evaluatePassword, validateSignUpFields } from "./passwordUtils";
import styles from "./SignInPage.module.css";

interface CredentialsFormProps {
  activeTab: "signin" | "signup";
}

export function CredentialsForm({ activeTab }: CredentialsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const evaluation = evaluatePassword(password);
  const isMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === "signup") {
      const validationError = validateSignUpFields(
        name,
        email,
        password,
        confirmPassword,
        evaluation,
      );
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "signup") {
        await registerWithCredentials(name.trim(), email.trim(), password);
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        setError(
          activeTab === "signup"
            ? "Account created, but automatic sign-in failed. Please sign in."
            : "Invalid email or password. Please try again."
        );
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
      setIsLoading(false);
    }
  };

  const isSignUp = activeTab === "signup";
  const submitLabel = isLoading
    ? null
    : isSignUp
    ? "Create Account"
    : "Sign In with Email";

  return (
    <>
      {error && (
        <div className={styles.errorAlert} role="alert">
          <svg className={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {isSignUp && (
          <div className={styles.inputGroup}>
            <label htmlFor="user-name" className={styles.label}>
              Full Name
            </label>
            <input
              id="user-name"
              type="text"
              placeholder="Jane Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              disabled={isLoading}
              required
            />
          </div>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="user-email" className={styles.label}>
            Email Address
          </label>
          <input
            id="user-email"
            type="email"
            placeholder="developer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            required
          />
        </div>

        <PasswordInput
          id="user-password"
          label="Password"
          value={password}
          onChange={setPassword}
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
          disabled={isLoading}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          toggleAriaLabel={showPassword ? "Hide password" : "Show password"}
        />

        {isSignUp && password.length > 0 && (
          <PasswordStrengthMeter
            label={evaluation.strengthLabel}
            color={evaluation.strengthColor}
            percent={evaluation.strengthPercent}
          />
        )}

        {isSignUp && (
          <PasswordCriteriaChecklist
            hasMinLength={evaluation.hasMinLength}
            hasUppercase={evaluation.hasUppercase}
            hasLowercase={evaluation.hasLowercase}
            hasNumber={evaluation.hasNumber}
            hasSpecial={evaluation.hasSpecial}
          />
        )}

        {isSignUp && (
          <div className={styles.inputGroup}>
            <PasswordInput
              id="user-confirm-password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              showPassword={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              disabled={isLoading}
              autoComplete="new-password"
              toggleAriaLabel={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            />
            {confirmPassword.length > 0 && (
              <PasswordMatchBadge isMatch={isMatch} />
            )}
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
          id="auth-submit-btn"
        >
          {isLoading ? <span className={styles.spinner} /> : submitLabel}
        </button>
      </form>
    </>
  );
}
