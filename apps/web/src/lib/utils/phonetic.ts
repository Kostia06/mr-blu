/**
 * Phonetic Matching Utilities
 *
 * Provides phonetic similarity algorithms for matching client names,
 * especially useful for speech-to-text transcription errors where
 * similar-sounding names may be spelled differently.
 *
 * Examples: "Cost" matches "Kos", "Jon" matches "John"
 */

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1];
			} else {
				dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
			}
		}
	}
	return dp[m][n];
}

/**
 * Normalize first character for comparison (handles k/c, s/z, etc.)
 * Used to boost similarity when first letters sound the same
 */
export function normalizeFirstChar(char: string): string {
	if ('ckq'.includes(char)) return 'k';
	if ('sz'.includes(char)) return 's';
	if ('gj'.includes(char)) return 'g';
	if ('fvp'.includes(char)) return 'f';
	return char;
}

/**
 * Get consonant skeleton of a word (removes vowels, normalizes consonants)
 * "Cost" -> "kst", "Kos" -> "ks"
 */
export function getConsonantSkeleton(str: string): string {
	return str
		.toLowerCase()
		.replace(/[aeiou]/g, '') // Remove all vowels
		.replace(/c/g, 'k') // c -> k
		.replace(/ph/g, 'f')
		.replace(/ck/g, 'k')
		.replace(/gh/g, '')
		.replace(/wh/g, 'w')
		.replace(/qu/g, 'kw')
		.replace(/x/g, 'ks')
		.replace(/(.)\1+/g, '$1'); // Remove double consonants
}

/**
 * Get Soundex-like code for phonetic matching
 * Names that sound similar get the same code
 */
export function getSoundexCode(str: string): string {
	if (!str) return '';
	const s = str.toLowerCase();

	// Normalize first letter (c/k sound the same, etc.)
	let firstChar = s[0];
	if (firstChar === 'c' || firstChar === 'k' || firstChar === 'q') firstChar = 'k';
	if (firstChar === 'f' || firstChar === 'v' || firstChar === 'p') firstChar = 'f';
	if (firstChar === 's' || firstChar === 'z') firstChar = 's';
	if (firstChar === 'g' || firstChar === 'j') firstChar = 'j';

	let code = firstChar;

	// Map consonants to numbers
	const map: Record<string, string> = {
		b: '1',
		f: '1',
		p: '1',
		v: '1',
		c: '2',
		g: '2',
		j: '2',
		k: '2',
		q: '2',
		s: '2',
		x: '2',
		z: '2',
		d: '3',
		t: '3',
		l: '4',
		m: '5',
		n: '5',
		r: '6'
	};

	let lastCode = map[s[0]] || '';

	for (let i = 1; i < s.length && code.length < 4; i++) {
		const char = s[i];
		const charCode = map[char] || '';

		// Skip vowels and 'h', 'w', 'y'
		if ('aeiouhwy'.includes(char)) {
			lastCode = ''; // Reset so next consonant is added
			continue;
		}

		// Skip if same code as previous (like double letters)
		if (charCode && charCode !== lastCode) {
			code += charCode;
			lastCode = charCode;
		}
	}

	// Pad with zeros
	return (code + '000').slice(0, 4);
}

/**
 * Check for common phonetic/speech-to-text mistakes
 * Returns a similarity score (0-1) based on phonetic similarity
 */
export function getPhoneticSimilarity(s1: string, s2: string): number {
	// Common speech-to-text confusions
	const replacements: [RegExp, string][] = [
		[/ph/g, 'f'],
		[/ck/g, 'k'],
		[/gh/g, ''],
		[/tion/g, 'shun'],
		[/sion/g, 'shun'],
		[/ee/g, 'i'],
		[/ea/g, 'e'],
		[/oo/g, 'u'],
		[/ey/g, 'ee'],
		[/ie/g, 'ee'],
		[/y$/g, 'ee'],
		[/ll/g, 'l'],
		[/ss/g, 's'],
		[/tt/g, 't'],
		[/nn/g, 'n'],
		[/rr/g, 'r'],
		[/c([ei])/g, 's$1'],
		[/qu/g, 'kw'],
		[/x/g, 'ks'],
		[/ough/g, 'o'],
		[/augh/g, 'af'],
		[/sch/g, 'sk'],
		[/tch/g, 'ch'],
		[/wr/g, 'r'],
		[/kn/g, 'n'],
		[/mb$/g, 'm'],
		[/mn$/g, 'm']
	];

	let normalized1 = s1;
	let normalized2 = s2;

	for (const [pattern, replacement] of replacements) {
		normalized1 = normalized1.replace(pattern, replacement);
		normalized2 = normalized2.replace(pattern, replacement);
	}

	if (normalized1 === normalized2) return 0.85;

	// Soundex comparison - if codes match, high similarity
	const soundex1 = getSoundexCode(s1);
	const soundex2 = getSoundexCode(s2);
	if (soundex1 === soundex2) return 0.8;

	// Partial Soundex match (first 2-3 chars)
	if (soundex1.slice(0, 3) === soundex2.slice(0, 3)) return 0.7;
	if (soundex1.slice(0, 2) === soundex2.slice(0, 2)) return 0.6;

	// Consonant skeleton comparison
	const skel1 = getConsonantSkeleton(s1);
	const skel2 = getConsonantSkeleton(s2);
	if (skel1 === skel2) return 0.75;

	// Check if one skeleton contains the other (for added/dropped sounds)
	if (skel1.includes(skel2) || skel2.includes(skel1)) return 0.65;

	const maxLen = Math.max(normalized1.length, normalized2.length);
	const distance = levenshteinDistance(normalized1, normalized2);
	return 1 - distance / maxLen;
}

/**
 * Calculate overall similarity score (0-1, higher is better)
 * Combines Levenshtein distance, phonetic matching, and word-level comparison
 *
 * @param str1 - First string to compare (e.g., search query)
 * @param str2 - Second string to compare (e.g., client name)
 * @returns Similarity score from 0 (no match) to 1 (exact match)
 */
export function calculateSimilarity(str1: string, str2: string): number {
	const s1 = str1.toLowerCase().trim();
	const s2 = str2.toLowerCase().trim();

	// Exact match
	if (s1 === s2) return 1;

	// Check if one contains the other
	if (s1.includes(s2) || s2.includes(s1)) return 0.9;

	// Check if first letters match (normalized for phonetic similarity)
	const firstLetterBonus = normalizeFirstChar(s1[0]) === normalizeFirstChar(s2[0]) ? 0.1 : 0;

	// Check for common phonetic mistakes
	const phoneticScore = getPhoneticSimilarity(s1, s2);

	// Levenshtein-based similarity
	const maxLen = Math.max(s1.length, s2.length);
	const distance = levenshteinDistance(s1, s2);
	const levenshteinScore = 1 - distance / maxLen;

	// Check word-by-word matching (for full names)
	const words1 = s1.split(/\s+/);
	const words2 = s2.split(/\s+/);
	let wordMatchScore = 0;

	for (const w1 of words1) {
		for (const w2 of words2) {
			const wordSim = 1 - levenshteinDistance(w1, w2) / Math.max(w1.length, w2.length);
			if (wordSim > 0.7) {
				wordMatchScore = Math.max(wordMatchScore, wordSim * 0.8);
			}
		}
	}

	// Combine scores
	return Math.min(1, Math.max(levenshteinScore, phoneticScore, wordMatchScore) + firstLetterBonus);
}

export interface ScoredMatch<T> {
	item: T;
	similarity: number;
}

/**
 * Score and rank items by similarity to a search term
 * @param items - Array of items to search
 * @param searchTerm - Search term to match against
 * @param getName - Function to extract name from item
 * @param minSimilarity - Minimum similarity threshold (default 0.3)
 * @param limit - Maximum number of results (default 5)
 */
export function findSimilarItems<T>(
	items: T[],
	searchTerm: string,
	getName: (item: T) => string,
	minSimilarity = 0.3,
	limit = 5
): ScoredMatch<T>[] {
	const scored = items.map((item) => ({
		item,
		similarity: calculateSimilarity(searchTerm, getName(item))
	}));

	return scored
		.filter((s) => s.similarity >= minSimilarity)
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, limit);
}
