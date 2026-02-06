<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import User from 'lucide-svelte/icons/user';
	import Sparkles from 'lucide-svelte/icons/sparkles';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { t } from '$lib/i18n';

	interface ClientSuggestion {
		id: string;
		name: string;
		estimateCount: number;
		invoiceCount: number;
		similarity: number;
	}

	interface Props {
		suggestions: ClientSuggestion[];
		bestMatch: ClientSuggestion | null;
		searchedDocType: string | null;
		manualSearchQuery: string;
		manualSearchResults: ClientSuggestion[];
		isSearching: boolean;
		onSelectClient: (name: string) => void;
		onSearch: (query: string) => void;
		onBack: () => void;
	}

	let {
		suggestions,
		bestMatch,
		searchedDocType,
		manualSearchQuery = $bindable(),
		manualSearchResults,
		isSearching,
		onSelectClient,
		onSearch,
		onBack
	}: Props = $props();

	function hasRelevantDocs(client: ClientSuggestion): boolean {
		if (searchedDocType === 'estimate') return client.estimateCount > 0;
		if (searchedDocType === 'invoice') return client.invoiceCount > 0;
		return client.estimateCount > 0 || client.invoiceCount > 0;
	}

	const otherSuggestions = $derived(
		bestMatch ? suggestions.filter((s) => s.id !== bestMatch?.id) : suggestions
	);
</script>

<div class="client-select-card">
	<div class="client-search-box">
		<Search size={18} class="search-icon" />
		<input
			type="text"
			placeholder={$t('placeholder.searchClients')}
			bind:value={manualSearchQuery}
			oninput={() => onSearch(manualSearchQuery)}
		/>
		{#if isSearching}
			<Loader2 size={18} class="spinning" />
		{/if}
	</div>

	<div class="client-list">
		{#if manualSearchResults.length > 0}
			{#each manualSearchResults as client (client.id)}
				<button class="client-option" onclick={() => onSelectClient(client.name)}>
					<User size={16} />
					<span class="client-name">{client.name}</span>
					<span class="match-percent">{Math.round(client.similarity * 100)}%</span>
				</button>
			{/each}
		{:else if bestMatch}
			{@const bestHasDocs = hasRelevantDocs(bestMatch)}
			<button
				class="client-option best"
				class:disabled={!bestHasDocs}
				onclick={() => bestHasDocs && onSelectClient(bestMatch.name)}
				disabled={!bestHasDocs}
			>
				<Sparkles size={16} />
				<span class="client-name">{bestMatch.name}</span>
				<span class="match-percent best">{Math.round(bestMatch.similarity * 100)}%</span>
			</button>
			{#each otherSuggestions.slice(0, 4) as client (client.id)}
				{@const clientHasDocs = hasRelevantDocs(client)}
				<button
					class="client-option"
					class:disabled={!clientHasDocs}
					onclick={() => clientHasDocs && onSelectClient(client.name)}
					disabled={!clientHasDocs}
				>
					<User size={16} />
					<span class="client-name">{client.name}</span>
					<span class="match-percent">{Math.round(client.similarity * 100)}%</span>
				</button>
			{/each}
		{:else if suggestions.length > 0}
			{#each suggestions.slice(0, 5) as client (client.id)}
				{@const clientHasDocs = hasRelevantDocs(client)}
				<button
					class="client-option"
					class:disabled={!clientHasDocs}
					onclick={() => clientHasDocs && onSelectClient(client.name)}
					disabled={!clientHasDocs}
				>
					<User size={16} />
					<span class="client-name">{client.name}</span>
					<span class="match-percent">{Math.round(client.similarity * 100)}%</span>
				</button>
			{/each}
		{:else}
			<div class="empty-state">
				<p>{$t('review.noClientsFound')}</p>
			</div>
		{/if}
	</div>
</div>

<div class="action-buttons">
	<button class="btn secondary" onclick={onBack}>
		<ChevronLeft size={18} />
		Back
	</button>
</div>

<style>
	.client-select-card {
		background: var(--white);
		border-radius: var(--radius-lg);
		border: 1px solid var(--gray-200);
		overflow: hidden;
		margin-bottom: var(--space-4);
	}

	.client-search-box {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-bottom: 1px solid var(--gray-100);
	}

	.client-search-box :global(.search-icon) {
		color: var(--gray-400);
		flex-shrink: 0;
	}

	.client-search-box input {
		flex: 1;
		border: none;
		outline: none;
		font-size: var(--text-base);
		background: transparent;
		color: var(--gray-900);
	}

	.client-search-box input::placeholder {
		color: var(--gray-400);
	}

	.client-search-box :global(.spinning) {
		color: var(--blu-primary);
	}

	.client-list {
		max-height: 280px;
		overflow-y: auto;
	}

	.client-option {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--gray-100);
		cursor: pointer;
		transition: background var(--duration-fast) ease;
		text-align: left;
	}

	.client-option:last-child {
		border-bottom: none;
	}

	.client-option:hover:not(.disabled) {
		background: var(--gray-50);
	}

	.client-option.best {
		background: var(--glass-primary-5);
	}

	.client-option.best:hover:not(.disabled) {
		background: var(--glass-primary-10);
	}

	.client-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.client-option :global(svg) {
		color: var(--gray-400);
		flex-shrink: 0;
	}

	.client-option.best :global(svg) {
		color: var(--blu-primary);
	}

	.client-option .client-name {
		flex: 1;
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--gray-900);
	}

	.client-option .match-percent {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--gray-500);
	}

	.client-option .match-percent.best {
		color: var(--data-green);
	}

	.client-list .empty-state {
		padding: var(--space-6);
		text-align: center;
		color: var(--gray-500);
	}

	.action-buttons {
		display: flex;
		gap: var(--space-3);
	}

	.action-buttons .btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 14px 24px;
		border-radius: 14px;
		font-size: 15px;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.btn.secondary {
		background: transparent;
		border: 1px solid var(--gray-200);
		color: var(--gray-600);
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
