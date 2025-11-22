/**
 * DOM Test Helpers - Type-safe DOM element helpers for UI tests
 * Replaces unnecessary type assertions in UI tests
 */

import { screen } from '@testing-library/svelte';

/**
 * Get select element by label - throws if not found or not a select
 * @param label Label text or regex pattern
 * @returns HTMLSelectElement
 * @throws Error if element not found or not a select element
 */
export function getSelectByLabel(label: string | RegExp): HTMLSelectElement {
	const element = screen.getByLabelText(label);
	if (!(element instanceof HTMLSelectElement)) {
		const labelStr = typeof label === 'string' ? label : label.toString();
		throw new Error(`Element with label "${labelStr}" is not a select element (got ${element.constructor.name})`);
	}
	return element;
}

/**
 * Get input element by label - throws if not found or not an input
 * @param label Label text or regex pattern
 * @returns HTMLInputElement
 * @throws Error if element not found or not an input element
 */
export function getInputByLabel(label: string | RegExp): HTMLInputElement {
	const element = screen.getByLabelText(label);
	if (!(element instanceof HTMLInputElement)) {
		const labelStr = typeof label === 'string' ? label : label.toString();
		throw new Error(`Element with label "${labelStr}" is not an input element (got ${element.constructor.name})`);
	}
	return element;
}

