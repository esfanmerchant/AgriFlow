// Lightweight client-side validators. Zero deps. Used on Login + Signup.

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// permissive phone: 7-15 digits with optional + and separators
export const phoneRegex = /^\+?[\d\s\-()]{7,18}$/;

export function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required.';
  if (!emailRegex.test(value.trim())) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(value, { min = 8 } = {}) {
  if (!value) return 'Password is required.';
  if (value.length < min) return `Password must be at least ${min} characters.`;
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    return 'Use both letters and numbers.';
  return null;
}

export function validateName(value) {
  if (!value || !value.trim()) return 'Full name is required.';
  if (value.trim().length < 2) return 'Name looks too short.';
  return null;
}

export function validatePhone(value, { required = false } = {}) {
  if (!value || !value.trim()) return required ? 'Phone is required.' : null;
  if (!phoneRegex.test(value.trim())) return 'Enter a valid phone number.';
  return null;
}
