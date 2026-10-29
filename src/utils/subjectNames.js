// Cleans the ERP's messy subject names for display.

/** Known typos in the ERP, keyed by the uppercased word. */
export const subjectNameFixes = {
  COUMPTING: 'Computing',
  COMPUTNG: 'Computing',
  ALGORITHIM: 'Algorithm',
  ALOGRITHM: 'Algorithm',
  MANAGMENT: 'Management',
  MANGEMENT: 'Management',
  ANALYTICES: 'Analytics',
  INTELLIGANCE: 'Intelligence',
  INTELIGENCE: 'Intelligence',
  ENGINERING: 'Engineering',
  LABORATRY: 'Laboratory',
};

/** Words kept fully uppercase. */
const ACRONYMS = new Set([
  'AI', 'ML', 'DBMS', 'OS', 'CN', 'IOT', 'IT', 'CSE', 'NSS', 'NCC', 'OOP', 'OOPS', 'API', 'UI', 'UX',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'B.TECH', 'BTECH', 'MCA', 'BCA', 'HR', 'DS', 'SQL', 'GIS', 'VLSI',
]);

/** Words kept lowercase unless they start the name. */
const SMALL = new Set(['and', 'of', 'the', 'in', 'for', 'to', 'on', 'with', 'a', 'an', 'or', 'by']);

const titleWord = (word, isFirst) => {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (subjectNameFixes[upper]) return subjectNameFixes[upper];
  if (ACRONYMS.has(upper)) return upper;
  if (/\d/.test(word)) return upper; // codes like "CS-101"
  const lower = word.toLowerCase();
  if (!isFirst && SMALL.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** Collapses repeated spaces, fixes known typos and Title Cases a name. */
export function cleanSubjectName(name) {
  if (typeof name !== 'string') return 'Unnamed subject';
  const collapsed = name.replace(/\s+/g, ' ').trim();
  if (!collapsed) return 'Unnamed subject';
  let first = true;
  return collapsed
    .split(' ')
    .map((token) => {
      // Keep separators like "/" and handle hyphenated words part by part.
      const out = token
        .split(/([-/(])/)
        .map((part) => (/^[-/(]$/.test(part) ? part : titleWord(part.replace(/[)]/g, ''), first) + (part.endsWith(')') ? ')' : '')))
        .join('');
      first = false;
      return out;
    })
    .join(' ');
}

/** Short label for tight spaces: first letters of the main words ("Principles of Economy and Society" → "PES"). */
export function subjectInitials(name) {
  const words = cleanSubjectName(name)
    .split(/\s+/)
    .filter((w) => w && !SMALL.has(w.toLowerCase()) && w !== '/');
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Semester labels like "M.SC | 1ST Year_II Sem" → "M.SC · 1st Year · II Sem". */
export function cleanSemesterName(name) {
  if (typeof name !== 'string' || !name.trim()) return '';
  return name
    .replace(/_/g, ' · ')
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .replace(/\b(\d+)(ST|ND|RD|TH)\b/gi, (_, n, s) => n + s.toLowerCase())
    .replace(/\bYEAR\b/gi, 'Year')
    .replace(/\bSEM\b/gi, 'Sem')
    .trim();
}
