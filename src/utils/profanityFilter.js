/**
 * Client & Server Profanity Filter & Content Moderation Utility
 * Detects, warns, masks, and removes curse words / abusive content.
 */

// Common profanities, slurs, insults, and typos
const PROFANITY_WORDS = [
  'fuck', 'fucking', 'fucker', 'fucked', 'fuckin', 'fuk', 'fck', 'f*ck', 'f**k',
  'bitch', 'bitches', 'bitching', 'bithc', 'btch', 'b*tch', 'b!tch',
  'shit', 'shitty', 'shitting', 'bullshit', 'sh*t', 's**t',
  'ass', 'asshole', 'assholes', 'a$$', 'a$$hole',
  'bastard', 'bastards',
  'cunt', 'cunts',
  'dick', 'dicks', 'dickhead',
  'pussy', 'pussies',
  'whore', 'whores', 'hoe',
  'slut', 'sluts',
  'cock', 'cocksucker',
  'nigger', 'nigga', 'niggers',
  'faggot', 'fag', 'fags',
  'retard', 'retarded',
  'stfu', 'gtfo'
];

// Build regex patterns with word boundaries and flexible punctuation/spaces
const PROFANITY_REGEX = new RegExp(
  `\\b(${PROFANITY_WORDS.map((w) => w.replace(/[*!$]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

/**
 * Checks if a text contains any curse words
 * @param {string} text 
 * @returns {boolean}
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  return PROFANITY_REGEX.test(text);
}

/**
 * Returns an array of unique curse words detected in text
 * @param {string} text 
 * @returns {string[]}
 */
export function getProfanityMatches(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(PROFANITY_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase())));
}

/**
 * Masks curse words with asterisks (e.g. "fuck" -> "f***")
 * @param {string} text 
 * @returns {string}
 */
export function cleanProfanity(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(PROFANITY_REGEX, (match) => {
    if (match.length <= 2) return '*'.repeat(match.length);
    return match[0] + '*'.repeat(match.length - 1);
  });
}

/**
 * Removes curse words completely from the text
 * @param {string} text 
 * @returns {string}
 */
export function removeProfanity(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(PROFANITY_REGEX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
