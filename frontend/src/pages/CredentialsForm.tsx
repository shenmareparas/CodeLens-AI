import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
  const navigate = useNavigate();
  const { login, register } = useAuth();
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
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.errorMessage}>{error}</div>}

      {activeTab === "signup" && (
        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className={styles.input}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>
      )}

      <div className={styles.inputGroup}>
        <label htmlFor="email" className={styles.label}>
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="developer@company.com"
          className={styles.input}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((prev) => !prev)}
        disabled={isLoading}
        autoComplete={
          activeTab === "signup" ? "new-password" : "current-password"
        }
      />

      {activeTab === "signup" && password.length > 0 && (
        <>
          <PasswordStrengthMeter
            label={evaluation.strengthLabel}
            color={evaluation.strengthColor}
            percent={evaluation.strengthPercent}
          />
          <PasswordCriteriaChecklist
            hasMinLength={evaluation.hasMinLength}
            hasUppercase={evaluation.hasUppercase}
            hasLowercase={evaluation.hasLowercase}
            hasNumber={evaluation.hasNumber}
            hasSpecial={evaluation.hasSpecial}
          />
        </>
      )}

      {activeTab === "signup" && (
        <>
          <PasswordInput
            id="confirmPassword"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            showPassword={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <PasswordMatchBadge
            isMatch={isMatch}
          />
        </>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitButton}
      >
        {isLoading
          ? "Processing..."
          : activeTab === "signup"
            ? "Create Account"
            : "Sign In with Email"}
      </button>
    </form>
  );
}
export default CredentialsForm;
