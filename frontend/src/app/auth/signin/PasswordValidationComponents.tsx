"use client";

import styles from "./SignInPage.module.css";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  toggleAriaLabel?: string;
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  disabled = false,
  placeholder = "••••••••",
  autoComplete,
  toggleAriaLabel = "Toggle password visibility",
}: PasswordInputProps) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.passwordWrapper}>
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.input} ${styles.passwordInput}`}
          disabled={disabled}
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className={styles.togglePasswordBtn}
          onClick={onToggleVisibility}
          aria-label={toggleAriaLabel}
          title={toggleAriaLabel}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

interface PasswordStrengthProps {
  label: string;
  color: string;
  percent: number;
}

export function PasswordStrengthMeter({ label, color, percent }: PasswordStrengthProps) {
  return (
    <div className={styles.strengthContainer} aria-live="polite">
      <div className={styles.strengthHeader}>
        <span className={styles.strengthLabel}>Password strength</span>
        <span className={styles.strengthValue} style={{ color }}>
          {label}
        </span>
      </div>
      <div className={styles.strengthBarTrack}>
        <div
          className={styles.strengthBarFill}
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

interface PasswordCriteriaProps {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function PasswordCriteriaChecklist({
  hasMinLength,
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasSpecial,
}: PasswordCriteriaProps) {
  return (
    <div className={styles.criteriaList} aria-label="Password requirements">
      <div className={`${styles.criteriaItem} ${hasMinLength ? styles.criteriaItemValid : ""}`}>
        <span className={`${styles.criteriaIcon} ${hasMinLength ? styles.criteriaIconValid : ""}`}>
          {hasMinLength ? <CheckIcon /> : <span className={styles.criteriaBullet} />}
        </span>
        <span>8+ characters</span>
      </div>
      <div className={`${styles.criteriaItem} ${hasUppercase ? styles.criteriaItemValid : ""}`}>
        <span className={`${styles.criteriaIcon} ${hasUppercase ? styles.criteriaIconValid : ""}`}>
          {hasUppercase ? <CheckIcon /> : <span className={styles.criteriaBullet} />}
        </span>
        <span>Uppercase (A-Z)</span>
      </div>
      <div className={`${styles.criteriaItem} ${hasLowercase ? styles.criteriaItemValid : ""}`}>
        <span className={`${styles.criteriaIcon} ${hasLowercase ? styles.criteriaIconValid : ""}`}>
          {hasLowercase ? <CheckIcon /> : <span className={styles.criteriaBullet} />}
        </span>
        <span>Lowercase (a-z)</span>
      </div>
      <div className={`${styles.criteriaItem} ${hasNumber ? styles.criteriaItemValid : ""}`}>
        <span className={`${styles.criteriaIcon} ${hasNumber ? styles.criteriaIconValid : ""}`}>
          {hasNumber ? <CheckIcon /> : <span className={styles.criteriaBullet} />}
        </span>
        <span>Number (0-9)</span>
      </div>
      <div className={`${styles.criteriaItem} ${hasSpecial ? styles.criteriaItemValid : ""}`}>
        <span className={`${styles.criteriaIcon} ${hasSpecial ? styles.criteriaIconValid : ""}`}>
          {hasSpecial ? <CheckIcon /> : <span className={styles.criteriaBullet} />}
        </span>
        <span>Special symbol</span>
      </div>
    </div>
  );
}

export function PasswordMatchBadge({ isMatch }: { isMatch: boolean }) {
  return (
    <div
      className={`${styles.matchBadge} ${isMatch ? styles.matchValid : styles.matchInvalid}`}
      aria-live="polite"
    >
      {isMatch ? (
        <>
          <CheckIcon />
          <span>Passwords match</span>
        </>
      ) : (
        <>
          <CrossIcon />
          <span>Passwords do not match</span>
        </>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

export function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
      <polyline points="3 8.5 6.5 12 13 4" />
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10">
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  );
}
