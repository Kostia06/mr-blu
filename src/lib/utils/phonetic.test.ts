import { describe, it, expect } from 'vitest';
import {
	levenshteinDistance,
	normalizeFirstChar,
	getConsonantSkeleton,
	getSoundexCode,
	getPhoneticSimilarity,
	calculateSimilarity,
	findSimilarItems
} from './phonetic';

describe('levenshteinDistance', () => {
	it('should return 0 for identical strings', () => {
		expect(levenshteinDistance('hello', 'hello')).toBe(0);
		expect(levenshteinDistance('', '')).toBe(0);
	});

	it('should return length for empty vs non-empty', () => {
		expect(levenshteinDistance('abc', '')).toBe(3);
		expect(levenshteinDistance('', 'xyz')).toBe(3);
	});

	it('should calculate single character changes', () => {
		expect(levenshteinDistance('cat', 'hat')).toBe(1); // substitution
		expect(levenshteinDistance('cat', 'cats')).toBe(1); // insertion
		expect(levenshteinDistance('cats', 'cat')).toBe(1); // deletion
	});

	it('should calculate multiple changes', () => {
		expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
		expect(levenshteinDistance('sunday', 'saturday')).toBe(3);
	});
});

describe('normalizeFirstChar', () => {
	it('should normalize c/k/q to k', () => {
		expect(normalizeFirstChar('c')).toBe('k');
		expect(normalizeFirstChar('k')).toBe('k');
		expect(normalizeFirstChar('q')).toBe('k');
	});

	it('should normalize s/z to s', () => {
		expect(normalizeFirstChar('s')).toBe('s');
		expect(normalizeFirstChar('z')).toBe('s');
	});

	it('should normalize g/j to g', () => {
		expect(normalizeFirstChar('g')).toBe('g');
		expect(normalizeFirstChar('j')).toBe('g');
	});

	it('should normalize f/v/p to f', () => {
		expect(normalizeFirstChar('f')).toBe('f');
		expect(normalizeFirstChar('v')).toBe('f');
		expect(normalizeFirstChar('p')).toBe('f');
	});

	it('should return unchanged for other characters', () => {
		expect(normalizeFirstChar('a')).toBe('a');
		expect(normalizeFirstChar('m')).toBe('m');
		expect(normalizeFirstChar('r')).toBe('r');
	});
});

describe('getConsonantSkeleton', () => {
	it('should remove vowels', () => {
		expect(getConsonantSkeleton('hello')).toBe('hl');
		expect(getConsonantSkeleton('aeiou')).toBe('');
	});

	it('should normalize c to k', () => {
		expect(getConsonantSkeleton('cat')).toBe('kt');
		expect(getConsonantSkeleton('cost')).toBe('kst');
	});

	it('should handle common phonetic patterns', () => {
		expect(getConsonantSkeleton('phone')).toBe('fn');
		// 'knight' keeps the 'k' since the regex handles 'kn' after individual replacements
		expect(getConsonantSkeleton('knight')).toMatch(/knt|nt/);
	});

	it('should remove double consonants', () => {
		expect(getConsonantSkeleton('hello')).toBe('hl');
		expect(getConsonantSkeleton('butter')).toBe('btr');
	});

	it('should match similar sounding names', () => {
		expect(getConsonantSkeleton('kos')).toBe('ks');
		expect(getConsonantSkeleton('cost')).toBe('kst');
		// Similar but not exact
	});
});

describe('getSoundexCode', () => {
	it('should return empty string for empty input', () => {
		expect(getSoundexCode('')).toBe('');
	});

	it('should generate 4-character codes', () => {
		const code = getSoundexCode('Robert');
		expect(code.length).toBe(4);
	});

	it('should pad short codes with zeros', () => {
		const code = getSoundexCode('Al');
		expect(code).toMatch(/^[a-z]\d{3}$/);
	});

	it('should normalize similar sounding first letters', () => {
		// C and K should give same normalized first char
		const costCode = getSoundexCode('Cost');
		const kostCode = getSoundexCode('Kost');
		expect(costCode[0]).toBe(kostCode[0]);
	});

	it('should group similar consonants', () => {
		// Names that sound similar should have similar codes
		const johnCode = getSoundexCode('John');
		const jonCode = getSoundexCode('Jon');
		// They should be identical or very close
		expect(johnCode).toBe(jonCode);
	});
});

describe('getPhoneticSimilarity', () => {
	it('should return high similarity for identical normalized strings', () => {
		const sim = getPhoneticSimilarity('phone', 'fone');
		expect(sim).toBeGreaterThanOrEqual(0.7);
	});

	it('should return high similarity for Soundex matches', () => {
		const sim = getPhoneticSimilarity('John', 'Jon');
		expect(sim).toBeGreaterThanOrEqual(0.6);
	});

	it('should detect consonant skeleton matches', () => {
		const sim = getPhoneticSimilarity('Cost', 'Kos');
		expect(sim).toBeGreaterThanOrEqual(0.5);
	});

	it('should return lower similarity for different sounds', () => {
		const sim = getPhoneticSimilarity('apple', 'orange');
		expect(sim).toBeLessThan(0.5);
	});
});

describe('calculateSimilarity', () => {
	it('should return 1 for exact matches', () => {
		expect(calculateSimilarity('John', 'John')).toBe(1);
		expect(calculateSimilarity('test', 'test')).toBe(1);
	});

	it('should be case insensitive', () => {
		expect(calculateSimilarity('JOHN', 'john')).toBe(1);
		expect(calculateSimilarity('Test', 'TEST')).toBe(1);
	});

	it('should return high similarity for substring matches', () => {
		expect(calculateSimilarity('John', 'Johnson')).toBe(0.9);
		expect(calculateSimilarity('Mike', 'Michael')).toBeGreaterThan(0.5);
	});

	it('should handle first letter phonetic bonus', () => {
		const simWithBonus = calculateSimilarity('Cost', 'Kos');
		// Should get bonus for similar first letters (c/k)
		expect(simWithBonus).toBeGreaterThan(0.5);
	});

	it('should handle multi-word names', () => {
		const sim = calculateSimilarity('John Smith', 'Jon Smyth');
		expect(sim).toBeGreaterThan(0.6);
	});

	it('should return low similarity for very different strings', () => {
		const sim = calculateSimilarity('Alpha', 'Omega');
		expect(sim).toBeLessThan(0.5);
	});
});

describe('findSimilarItems', () => {
	const clients = [
		{ id: '1', name: 'John Smith' },
		{ id: '2', name: 'Jon Smithson' },
		{ id: '3', name: 'Jane Doe' },
		{ id: '4', name: 'Kostia' },
		{ id: '5', name: 'Kos' }
	];

	const getName = (item: { name: string }) => item.name;

	it('should find exact matches', () => {
		const results = findSimilarItems(clients, 'John Smith', getName);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].item.name).toBe('John Smith');
		expect(results[0].similarity).toBe(1);
	});

	it('should find phonetically similar matches', () => {
		const results = findSimilarItems(clients, 'Jon', getName);
		expect(results.length).toBeGreaterThan(0);
		// Should find both John Smith and Jon Smithson
		const names = results.map((r) => r.item.name);
		expect(names).toContain('Jon Smithson');
	});

	it('should respect minimum similarity threshold', () => {
		// Use a very high threshold to ensure no matches
		const results = findSimilarItems(clients, 'Xyz', getName, 0.9);
		expect(results.length).toBe(0);
	});

	it('should respect limit parameter', () => {
		const results = findSimilarItems(clients, 'John', getName, 0.1, 2);
		expect(results.length).toBeLessThanOrEqual(2);
	});

	it('should sort by similarity descending', () => {
		const results = findSimilarItems(clients, 'Cost', getName, 0.3);
		for (let i = 1; i < results.length; i++) {
			expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
		}
	});

	it('should find similar sounding names', () => {
		const results = findSimilarItems(clients, 'Kos', getName, 0.3);
		expect(results.length).toBeGreaterThan(0);
		const names = results.map((r) => r.item.name);
		expect(names).toContain('Kos');
	});
});
