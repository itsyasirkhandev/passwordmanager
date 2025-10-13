export type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
};

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const analysis: { [key: string]: boolean } = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  if (password.length > 0) {
    score = Object.values(analysis).filter(Boolean).length;
    // A length of less than 8 is always weak, regardless of other factors
    if (password.length < 8) {
        score = 1;
    }
  }

  switch (score) {
    case 0:
    case 1:
      return { score, label: 'Weak', color: 'bg-red-500' };
    case 2:
      return { score, label: 'Medium', color: 'bg-yellow-500' };
    case 3:
      return { score, label: 'Strong', color: 'bg-blue-500' };
    case 4:
    case 5:
      return { score: 4, label: 'Very Strong', color: 'bg-green-500' };
    default:
      return { score: 0, label: '', color: 'bg-muted' };
  }
};
