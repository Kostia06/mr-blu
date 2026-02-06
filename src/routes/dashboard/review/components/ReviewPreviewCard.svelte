<script lang="ts">
	import { t } from '$lib/i18n';
	import FileText from 'lucide-svelte/icons/file-text';
	import Receipt from 'lucide-svelte/icons/receipt';
	import User from 'lucide-svelte/icons/user';
	import DollarSign from 'lucide-svelte/icons/dollar-sign';
	import Calendar from 'lucide-svelte/icons/calendar';
	import Mail from 'lucide-svelte/icons/mail';
	import Pencil from 'lucide-svelte/icons/pencil';
	import Check from 'lucide-svelte/icons/check';
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Search from 'lucide-svelte/icons/search';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	interface ClientSuggestionFull {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		address: string | null;
		similarity: number;
	}

	interface ClientData {
		name: string | null;
		firstName: string | null;
		lastName: string | null;
		email: string | null;
		phone: string | null;
		address: string | null;
	}

	interface ParsedData {
		documentType: 'invoice' | 'estimate';
		client: ClientData;
		dueDate: string | null;
		[key: string]: any;
	}

	let {
		data = $bindable(),
		documentNumber,
		calculatedTotal,
		exactClientMatch,
		clientSuggestions,
		showClientSuggestions = $bindable(),
		clientFullName,
		formatCurrency,
		onSearchClients,
		onSelectClientFromDropdown,
		onApplyClientSuggestion,
		onParseClientName,
		onDocNumberChange,
		onSaveClientInfo
	}: {
		data: ParsedData;
		documentNumber: string;
		calculatedTotal: number;
		exactClientMatch: ClientSuggestionFull | null;
		clientSuggestions: ClientSuggestionFull[];
		showClientSuggestions: boolean;
		clientFullName: string;
		formatCurrency: (amount: number) => string;
		onSearchClients: (query: string) => void;
		onSelectClientFromDropdown: (client: ClientSuggestionFull) => void;
		onApplyClientSuggestion: (client: ClientSuggestionFull) => void;
		onParseClientName: (name: string) => { firstName: string; lastName: string };
		onDocNumberChange: (newNumber: string) => void;
		onSaveClientInfo?: (info: { clientId: string; email?: string; name?: string }) => void;
	} = $props();

	// Internal state
	let isEditingDocNumber = $state(false);
	let editableDocNumber = $state('');
	let isEditingClientName = $state(false);
	let editableClientName = $state('');
	let clientSearchQuery = $state('');
	let showClientDropdown = $state(false);
	let clientDropdownResults = $state<ClientSuggestionFull[]>([]);
	let isSearchingClients = $state(false);
	let selectedClientId = $state<string | null>(null);

	// Sync selectedClientId when AI finds an exact client match
	$effect(() => {
		if (exactClientMatch?.id && !selectedClientId) {
			selectedClientId = exactClientMatch.id;
		}
	});

	async function searchClients(query: string) {
		isSearchingClients = true;
		clientDropdownResults = [];
		onSearchClients(query);
		// The parent handles search; we need to receive results back
		// For now, use a fetch directly like the parent did
		try {
			const response = await fetch('/api/clients/suggest', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: query, limit: 5 })
			});
			if (response.ok) {
				const result = await response.json();
				if (result.success && result.suggestions) {
					clientDropdownResults = result.suggestions;
				}
			}
		} catch (error) {
			console.error('Client search error:', error);
		} finally {
			isSearchingClients = false;
		}
	}

	function selectClientFromDropdown(client: ClientSuggestionFull) {
		selectedClientId = client.id;
		onSelectClientFromDropdown(client);
	}
</script>

<div class="preview-card">
	<div class="preview-header">
		<div class="doc-type-badge" class:estimate={data.documentType === 'estimate'}>
			{#if data.documentType === 'estimate'}
				<FileText size={14} />
			{:else}
				<Receipt size={14} />
			{/if}
			<span>{data.documentType === 'estimate' ? 'Estimate' : 'Invoice'}</span>
		</div>
		{#if isEditingDocNumber}
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="doc-number-input"
				type="text"
				bind:value={editableDocNumber}
				onblur={() => {
					if (editableDocNumber.trim()) {
						onDocNumberChange(editableDocNumber.trim());
					}
					isEditingDocNumber = false;
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						if (editableDocNumber.trim()) {
							onDocNumberChange(editableDocNumber.trim());
						}
						isEditingDocNumber = false;
					}
					if (e.key === 'Escape') {
						editableDocNumber = documentNumber;
						isEditingDocNumber = false;
					}
				}}
				autofocus
			/>
		{:else}
			<button
				class="doc-number-btn"
				onclick={() => {
					editableDocNumber = documentNumber;
					isEditingDocNumber = true;
				}}
			>
				<span class="doc-number">#{documentNumber}</span>
				<Pencil size={12} class="edit-icon" />
			</button>
		{/if}
	</div>

	<div class="preview-body">
		<!-- Client + Total side by side -->
		<div class="client-total-row">
			<!-- Client Side (left) -->
			<div class="client-side">
				<div class="client-row-wrapper">
					{#if isEditingClientName}
						<div class="client-editing-form">
							<div class="client-edit-field">
								<label for="edit-client-name">
									<User
										size={12}
										style="display:inline; vertical-align: -2px; margin-right: 4px;"
									/>
									{$t('review.client')}
								</label>
								<div class="client-name-search-wrapper">
									<!-- svelte-ignore a11y_autofocus -->
									<input
										id="edit-client-name"
										class="client-name-input"
										type="text"
										bind:value={editableClientName}
										oninput={() => {
											clientSearchQuery = editableClientName;
											if (editableClientName.length >= 2) {
												searchClients(editableClientName);
												showClientDropdown = true;
											} else {
												showClientDropdown = false;
											}
										}}
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												if (editableClientName.trim()) {
													const { firstName, lastName } = onParseClientName(editableClientName);
													data.client.firstName = firstName;
													data.client.lastName = lastName;
													data.client.name = editableClientName.trim();
												}
												showClientDropdown = false;
												isEditingClientName = false;
											}
											if (e.key === 'Escape') {
												showClientDropdown = false;
												isEditingClientName = false;
											}
										}}
										onfocus={() => {
											if (editableClientName.length >= 2) {
												clientSearchQuery = editableClientName;
												searchClients(editableClientName);
												showClientDropdown = true;
											}
										}}
										placeholder={$t('review.selectDifferentClient')}
										autofocus
									/>
									<Search size={14} class="search-icon-inside" />
								</div>

								<!-- Inline search results -->
								{#if showClientDropdown && (isSearchingClients || clientDropdownResults.length > 0)}
									<div class="client-search-results">
										{#if isSearchingClients}
											<div class="dropdown-loading">
												<Loader2 size={16} class="spinning" />
												<span>{$t('review.searching')}</span>
											</div>
										{:else}
											{#each clientDropdownResults as client}
												<button
													class="dropdown-item"
													onclick={() => {
														selectClientFromDropdown(client);
														showClientDropdown = false;
														isEditingClientName = false;
													}}
												>
													<div class="dropdown-item-info">
														<span class="dropdown-item-name">{client.name}</span>
														{#if client.email}
															<span class="dropdown-item-detail">{client.email}</span>
														{/if}
													</div>
													{#if client.similarity >= 0.8}
														<span class="match-badge high">{$t('review.highMatch')}</span>
													{:else if client.similarity >= 0.6}
														<span class="match-badge medium">{$t('review.goodMatch')}</span>
													{/if}
												</button>
											{/each}
										{/if}
									</div>
								{/if}
							</div>
							<div class="client-edit-field">
								<label for="edit-client-email">
									<Mail
										size={12}
										style="display:inline; vertical-align: -2px; margin-right: 4px;"
									/>
									{$t('review.email')}
								</label>
								<input
									id="edit-client-email"
									class="client-email-input"
									type="email"
									value={data.client.email || ''}
									oninput={(e) => {
										data.client.email = (e.target as HTMLInputElement).value || null;
									}}
									placeholder="email@example.com"
									onblur={(e) => {
										const newEmail = (e.target as HTMLInputElement).value?.trim();
										if (newEmail && selectedClientId && onSaveClientInfo) {
											onSaveClientInfo({
												clientId: selectedClientId,
												email: newEmail
											});
										}
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === 'Escape') {
											if (editableClientName.trim()) {
												const { firstName, lastName } = onParseClientName(editableClientName);
												data.client.firstName = firstName;
												data.client.lastName = lastName;
												data.client.name = editableClientName.trim();
											}
											isEditingClientName = false;
										}
									}}
								/>
							</div>
							<button
								class="done-edit-client-btn"
								onclick={() => {
									if (editableClientName.trim()) {
										const { firstName, lastName } = onParseClientName(editableClientName);
										data.client.firstName = firstName;
										data.client.lastName = lastName;
										data.client.name = editableClientName.trim();
									}
									if (selectedClientId && onSaveClientInfo) {
										onSaveClientInfo({
											clientId: selectedClientId,
											email: data.client.email || undefined,
											name: data.client.name || undefined
										});
									}
									showClientDropdown = false;
									isEditingClientName = false;
								}}
							>
								<Check size={14} />
								{$t('common.done')}
							</button>
						</div>
					{:else}
						<button
							class="preview-row client-row-btn"
							class:has-warning={!clientFullName}
							onclick={() => {
								editableClientName = clientFullName || '';
								isEditingClientName = true;
							}}
						>
							<User size={16} class="preview-icon" />
							<div class="preview-info">
								<span class="preview-label">{$t('review.client')}</span>
								<span class="preview-value" class:missing={!clientFullName}>
									{clientFullName || 'Tap to select'}
								</span>
								{#if data.client.email}
									<span class="client-email-hint">{data.client.email}</span>
								{/if}
							</div>
							{#if !clientFullName}
								<div class="inline-warning" title="Client name is required">
									<AlertTriangle size={16} />
								</div>
							{:else if !data.client.email}
								<div class="inline-warning" title="Email is missing">
									<AlertTriangle size={16} />
								</div>
							{:else}
								<div class="inline-valid" title="Client set">
									<Check size={16} />
								</div>
							{/if}
						</button>
					{/if}
				</div>

				<!-- Client Suggestions for document creation (auto-shown) -->
				{#if !showClientDropdown && showClientSuggestions && clientSuggestions.length > 0}
					<div class="client-suggestions-inline">
						<div class="suggestions-header-inline">
							<Search size={14} />
							<span>{$t('review.didYouMean')}</span>
						</div>
						<div class="suggestions-chips">
							{#each clientSuggestions as suggestion}
								<button class="suggestion-chip" onclick={() => onApplyClientSuggestion(suggestion)}>
									<span class="chip-name">{suggestion.name}</span>
									{#if suggestion.similarity >= 0.8}
										<span class="chip-match high">✓</span>
									{:else if suggestion.similarity >= 0.6}
										<span class="chip-match medium">~</span>
									{/if}
								</button>
							{/each}
							<button
								class="suggestion-chip dismiss"
								onclick={() => (showClientSuggestions = false)}
							>
								Keep "{clientFullName}"
							</button>
						</div>
					</div>
				{/if}

				<!-- Due Date (left, under client) -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="preview-row due-date-row"
					onclick={(e) => {
						const input = (e.currentTarget as HTMLElement).querySelector(
							'.due-date-input'
						) as HTMLInputElement;
						if (input) {
							input.showPicker?.();
							input.focus();
						}
					}}
				>
					<Calendar size={16} class="preview-icon" />
					<div class="preview-info">
						<span class="preview-label">{$t('review.dueDate')}</span>
						<input
							type="date"
							class="due-date-input"
							value={data.dueDate || ''}
							onclick={(e) => e.stopPropagation()}
							oninput={(e) => {
								data.dueDate = (e.target as HTMLInputElement).value || null;
							}}
						/>
					</div>
				</div>
			</div>

			<!-- Total Side (right) -->
			<div class="total-side">
				<div class="total-block" class:has-warning={calculatedTotal <= 0}>
					<DollarSign size={16} class="preview-icon" />
					<div class="preview-info">
						<span class="preview-label"
							>{$t('review.total')}
							<span class="total-hint">{$t('review.fromLineItems')}</span></span
						>
						<span class="preview-value amount" class:warning-value={calculatedTotal <= 0}
							>{formatCurrency(calculatedTotal)}</span
						>
					</div>
					{#if calculatedTotal <= 0}
						<div class="inline-warning" title="Total must be greater than $0">
							<AlertTriangle size={16} />
						</div>
					{:else}
						<div class="inline-valid" title="Valid amount">
							<Check size={16} />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.due-date-input::-webkit-calendar-picker-indicator) {
		display: none !important;
		-webkit-appearance: none;
	}
	:global(.due-date-input::-webkit-inner-spin-button),
	:global(.due-date-input::-webkit-clear-button) {
		display: none !important;
	}

	.preview-card {
		background: var(--white);
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-card);
		overflow: hidden;
		box-shadow: var(--shadow-card-rest);
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--gray-100);
	}

	.doc-type-badge {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--space-1-5) var(--space-3);
		background: var(--glass-primary-10);
		border-radius: var(--radius-input);
		color: var(--blu-primary);
		font-size: var(--text-xs);
		font-weight: var(--font-semibold);
		text-transform: uppercase;
	}

	.doc-type-badge.estimate {
		background: var(--glass-amber-10);
		color: var(--data-amber);
	}

	.doc-number {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: var(--gray-500);
	}

	.doc-number-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.doc-number-btn:hover {
		background: var(--gray-100);
		border-color: #e2e8f0;
	}

	.doc-number-btn :global(.edit-icon) {
		color: var(--gray-400);
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.doc-number-btn:hover :global(.edit-icon) {
		opacity: 1;
	}

	.doc-number-input {
		padding: 4px 8px;
		border: 1px solid var(--blu-primary, #0066ff);
		border-radius: 6px;
		font-size: 12px;
		font-family: monospace;
		color: var(--gray-900);
		background: var(--white);
		outline: none;
		width: 120px;
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.preview-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.client-total-row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.client-side {
		flex: 1;
		min-width: 0;
	}

	.total-side {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-end;
		text-align: right;
	}

	.total-block {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.total-block .preview-info {
		align-items: flex-end;
	}

	.due-date-row {
		margin-top: 16px;
		cursor: pointer;
	}

	.total-block.has-warning {
		color: var(--data-amber);
	}

	.client-editing-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: rgba(0, 102, 255, 0.03);
		border: 1px solid rgba(0, 102, 255, 0.12);
		border-radius: 14px;
		padding: 16px;
	}

	.client-edit-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.client-edit-field label {
		font-size: 11px;
		font-weight: 600;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.client-name-search-wrapper {
		position: relative;
	}

	.client-name-search-wrapper :global(.search-icon-inside) {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--gray-400);
		pointer-events: none;
	}

	.client-name-input,
	.client-email-input {
		font-size: 14px;
		color: var(--gray-900);
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		padding: 10px 12px;
		background: white;
		width: 100%;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.client-name-input {
		padding-right: 36px;
	}

	.client-name-input:focus,
	.client-email-input:focus {
		outline: none;
		border-color: var(--blu-primary, #0066ff);
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.client-name-input::placeholder,
	.client-email-input::placeholder {
		color: var(--gray-400);
	}

	.client-search-results {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		overflow: hidden;
		background: white;
		max-height: 180px;
		overflow-y: auto;
	}

	.client-search-results .dropdown-item {
		border-radius: 0;
		border: none;
		border-bottom: 1px solid var(--gray-100);
	}

	.client-search-results .dropdown-item:last-child {
		border-bottom: none;
	}

	.done-edit-client-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px 20px;
		border: none;
		border-radius: 10px;
		background: var(--blu-primary, #0066ff);
		color: white;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(0, 102, 255, 0.25);
		align-self: flex-end;
	}

	.done-edit-client-btn:hover {
		background: #0055dd;
		box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
	}

	.client-email-hint {
		font-size: 12px;
		color: var(--gray-400);
	}

	@media (max-width: 480px) {
		.client-total-row {
			flex-direction: column;
			gap: 12px;
		}

		.total-side {
			align-items: flex-start;
			text-align: left;
			width: 100%;
		}

		.total-block .preview-info {
			align-items: flex-start;
		}
	}

	.preview-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.preview-row :global(.preview-icon) {
		color: var(--gray-500);
	}

	.preview-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}

	.preview-label {
		font-size: 11px;
		color: var(--gray-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.preview-value {
		font-size: 15px;
		color: var(--gray-900);
		font-weight: 500;
	}

	.preview-value.missing {
		color: rgba(248, 113, 113, 0.8);
		font-style: italic;
	}

	.preview-value.amount {
		color: var(--data-green);
		font-size: 18px;
		font-weight: 700;
	}

	.preview-value.warning-value {
		color: var(--data-amber);
	}

	.inline-warning {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(245, 158, 11, 0.12);
		border-radius: 8px;
		color: var(--data-amber);
		flex-shrink: 0;
		margin-left: auto;
	}

	.inline-valid {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(16, 185, 129, 0.12);
		border-radius: 8px;
		color: var(--data-green);
		flex-shrink: 0;
		margin-left: auto;
	}

	.preview-row.has-warning {
		background: rgba(245, 158, 11, 0.04);
		margin: -8px -12px;
		padding: 8px 12px;
		border-radius: 8px;
	}

	.client-row-wrapper {
		position: relative;
	}

	.client-row-btn {
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s ease;
		border-radius: 10px;
	}

	.client-row-btn:hover {
		background: transparent;
	}

	.client-row-btn .preview-value {
		background: var(--gray-50);
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		padding: 6px 12px;
		display: inline-block;
		transition: all 0.2s ease;
	}

	.client-row-btn:hover .preview-value {
		border-color: var(--gray-300);
		background: white;
	}

	.dropdown-loading {
		padding: 20px;
		text-align: center;
		color: var(--gray-500);
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 12px 14px;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--gray-100);
		cursor: pointer;
		text-align: left;
		transition: background 0.2s ease;
	}

	.dropdown-item:hover {
		background: transparent;
	}

	.dropdown-item:last-child {
		border-bottom: none;
	}

	.dropdown-item-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.dropdown-item-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900);
	}

	.dropdown-item-detail {
		font-size: 12px;
		color: var(--gray-500);
	}

	.match-badge {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
	}

	.match-badge.high {
		background: rgba(16, 185, 129, 0.12);
		color: var(--data-green);
	}

	.match-badge.medium {
		background: rgba(245, 158, 11, 0.12);
		color: var(--data-amber);
	}

	.due-date-input {
		background: var(--gray-50);
		border: 1px solid var(--gray-200);
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-900);
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s ease;
		-webkit-appearance: none;
		appearance: none;
		width: 160px;
		overflow: hidden;
	}

	.due-date-input:hover {
		border-color: var(--gray-300);
		background: white;
	}

	.due-date-input:focus {
		outline: none;
		border-color: var(--blu-primary, #0066ff);
		background: white;
		box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
	}

	.due-date-input:invalid,
	.due-date-input[value=''] {
		color: var(--gray-400);
	}

	.total-hint {
		font-weight: 400;
		font-size: 11px;
		color: var(--gray-400);
	}

	.client-suggestions-inline {
		padding: 12px;
		background: rgba(14, 165, 233, 0.06);
		border: 1px solid rgba(14, 165, 233, 0.15);
		border-radius: 10px;
		margin: 4px -4px;
	}

	.suggestions-header-inline {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 10px;
		font-size: 12px;
		font-weight: 500;
		color: #0284c7;
	}

	.suggestions-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.suggestion-chip {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--white);
		border: 1px solid rgba(14, 165, 233, 0.3);
		border-radius: 20px;
		font-size: 13px;
		color: var(--gray-900);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.suggestion-chip:hover {
		background: rgba(14, 165, 233, 0.1);
		border-color: #0ea5e9;
	}

	.suggestion-chip.dismiss {
		background: transparent;
		border-color: var(--gray-300);
		color: var(--gray-500);
	}

	.suggestion-chip.dismiss:hover {
		background: var(--gray-100);
		border-color: var(--gray-400);
		color: var(--gray-700);
	}

	.chip-name {
		font-weight: 500;
	}

	.chip-match {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		font-size: 10px;
		font-weight: 600;
	}

	.chip-match.high {
		background: rgba(16, 185, 129, 0.2);
		color: #059669;
	}

	.chip-match.medium {
		background: rgba(245, 158, 11, 0.2);
		color: #d97706;
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
