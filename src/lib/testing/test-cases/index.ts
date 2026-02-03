// AI Test Cases Index
// Exports all test cases for the AI parser test suite

import type { AITestCase, TestCategory } from '../types';

import { documentCreationTests } from './document-creation';
import { informationQueryTests } from './information-queries';
import { documentCloneTests } from './document-clone';
import { documentMergeTests } from './document-merge';
import { documentSendTests } from './document-send';
import { documentTransformTests } from './document-transform';
import { taxHandlingTests } from './tax-handling';
import { edgeCaseTests } from './edge-cases';
import { clientIdentificationTests } from './client-identification';
import { paymentReminderTests } from './payment-reminder';
import { advancedScenarioTests } from './advanced-scenarios';

// Export individual test suites
export {
	documentCreationTests,
	informationQueryTests,
	documentCloneTests,
	documentMergeTests,
	documentSendTests,
	documentTransformTests,
	taxHandlingTests,
	edgeCaseTests,
	clientIdentificationTests,
	paymentReminderTests,
	advancedScenarioTests
};

// Combined test suite
export const allTestCases: AITestCase[] = [
	...documentCreationTests,
	...informationQueryTests,
	...documentCloneTests,
	...documentMergeTests,
	...documentSendTests,
	...documentTransformTests,
	...taxHandlingTests,
	...edgeCaseTests,
	...clientIdentificationTests,
	...paymentReminderTests,
	...advancedScenarioTests
];

// Get tests by category
export function getTestsByCategory(category: TestCategory): AITestCase[] {
	return allTestCases.filter((test) => test.category === category);
}

// Get tests by tag
export function getTestsByTag(tag: string): AITestCase[] {
	return allTestCases.filter((test) => test.tags?.includes(tag));
}

// Get tests by priority
export function getTestsByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): AITestCase[] {
	return allTestCases.filter((test) => test.priority === priority);
}

// Get tests by multiple tags (AND logic)
export function getTestsByTags(tags: string[]): AITestCase[] {
	return allTestCases.filter((test) => tags.every((tag) => test.tags?.includes(tag)));
}

// Get test by ID
export function getTestById(id: string): AITestCase | undefined {
	return allTestCases.find((test) => test.id === id);
}

// Get tests by tag (OR logic - any matching tag)
export function getTestsByAnyTag(tags: string[]): AITestCase[] {
	return allTestCases.filter((test) => tags.some((tag) => test.tags?.includes(tag)));
}

// Statistics
export const testStats = {
	total: allTestCases.length,
	byCategory: {
		document_creation: documentCreationTests.length,
		information_query: informationQueryTests.length,
		document_clone: documentCloneTests.length,
		document_merge: documentMergeTests.length,
		document_send: documentSendTests.length,
		document_transform: documentTransformTests.length,
		tax_handling: taxHandlingTests.length,
		edge_case: edgeCaseTests.length + advancedScenarioTests.length,
		client_identification: clientIdentificationTests.length,
		payment_reminder: paymentReminderTests.length
	},
	byPriority: {
		critical: allTestCases.filter((t) => t.priority === 'critical').length,
		high: allTestCases.filter((t) => t.priority === 'high').length,
		medium: allTestCases.filter((t) => t.priority === 'medium').length,
		low: allTestCases.filter((t) => t.priority === 'low').length
	}
};
