export function checkPasswordStrength(password) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
    { label: 'One special character (!@#$...)', pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter(c => c.pass).length;

  let level = 'weak';
  if (score >= 4) level = 'strong';
  else if (score >= 3) level = 'medium';

  return { checks, score, level, isValid: score === 5 };
}