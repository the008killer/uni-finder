/**
 * Checks if a value is clean, valid, and displayable.
 * Filters out null, undefined, empty strings, and raw placeholders like 'None' or 'N/A'.
 */
export function isValidData(val) {
  if (val === null || val === undefined || val === '') return false;
  const str = String(val).trim().toLowerCase();
  return str !== '' && str !== 'none' && str !== 'n/a' && str !== 'null';
}