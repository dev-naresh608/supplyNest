/**
 * Escapes special regex characters in a string to safely use within RegExp queries.
 * Prevents ReDoS attacks and RegExp syntax errors.
 * @param {string} str
 * @returns {string}
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
