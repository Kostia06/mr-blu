<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import FileText from 'lucide-svelte/icons/file-text';
	import ClipboardList from 'lucide-svelte/icons/clipboard-list';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ArrowLeftRight from 'lucide-svelte/icons/arrow-left-right';
	import Check from 'lucide-svelte/icons/check';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import { t } from '$lib/i18n';

	interface SourceDocument {
		id: string;
		type: 'invoice' | 'estimate';
		number: string;
		total: number;
		clientId?: string;
		clientName: string;
		clientEmail?: string;
		items: Array<{
			id: string;
			description: string;
			quantity: number;
			rate: number;
			total: number;
		}>;
		createdAt?: Date;
	}

	interface Props {
		sourceDocument: SourceDocument;
		initialConversion?: { enabled: boolean; targetType: 'invoice' | 'estimate' };
		initialSplit?: any;
		initialSchedule?: any;
		isExecuting?: boolean;
		error?: string | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		onExecute: (config: any) => void;
		onBack: () => void;
		[key: string]: any;
	}

	interface TransformConfig {
		conversion: { enabled: boolean; targetType: 'invoice' | 'estimate' };
	}

	let {
		sourceDocument,
		initialConversion = { enabled: true, targetType: 'invoice' },
		onExecute,
		onBack
	}: Props = $props();

	// Conversion state
	let conversionEnabled = $state(true);
	let targetType = $state<'invoice' | 'estimate'>('invoice');

	// Initialize form values from props
	let initialized = $state(false);
	$effect(() => {
		if (!initialized) {
			conversionEnabled = initialConversion.enabled;
			targetType = initialConversion.targetType;
			initialized = true;
		}
	});

	// UI state
	let isProcessing = $state(false);

	// Helper to format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	// Computed: effective document type after conversion
	let effectiveType = $derived(conversionEnabled ? targetType : sourceDocument.type);

	// Computed: summary text
	let summaryText = $derived.by(() => {
		if (!conversionEnabled || sourceDocument.type === targetType) {
			return $t('review.noConversionNeeded');
		}
		return $t('review.convertFromTo', { from: sourceDocument.type, to: targetType });
	});

	// Computed: validation
	let isValid = $derived.by(() => {
		// Must be converting to a different type
		return conversionEnabled && sourceDocument.type !== targetType;
	});

	function handleExecute() {
		if (!isValid || isProcessing) return;

		isProcessing = true;

		const config: TransformConfig = {
			conversion: {
				enabled: conversionEnabled,
				targetType
			}
		};

		onExecute(config);
	}
</script>

<div class="transform-review">
	<!-- Source Document Card -->
	<section class="section source-section" in:fly={{ y: 10, duration: 200, easing: cubicOut }}>
		<h2 class="section-title">{$t('review.sourceDocument')}</h2>

		<div class="source-card">
			<div class="source-icon">
				{#if sourceDocument.type === 'invoice'}
					<FileText size={24} strokeWidth={1.5} />
				{:else}
					<ClipboardList size={24} strokeWidth={1.5} />
				{/if}
			</div>

			<div class="source-info">
				<p class="source-type">
					{sourceDocument.type === 'invoice' ? $t('review.invoice') : $t('review.estimate')} #{sourceDocument.number}
				</p>
				<p class="source-client">{sourceDocument.clientName}</p>
			</div>

			<div class="source-total">
				{formatCurrency(sourceDocument.total)}
			</div>
		</div>
	</section>

	<!-- Conversion Section -->
	<section class="section" in:fly={{ y: 10, duration: 200, easing: cubicOut, delay: 50 }}>
		<div class="section-header">
			<div class="section-header-left">
				<div class="section-icon">
					<ArrowLeftRight size={18} />
				</div>
				<h2 class="section-title-inline">{$t('review.convertType')}</h2>
			</div>
		</div>

		<div class="conversion-content">
			<div class="type-toggle">
				<button
					class="type-btn"
					class:active={targetType === 'estimate'}
					class:source={sourceDocument.type === 'estimate'}
					onclick={() => (targetType = 'estimate')}
					type="button"
				>
					<ClipboardList size={18} />
					{$t('review.estimate')}
					{#if sourceDocument.type === 'estimate'}
						<span class="current-badge">{$t('review.current')}</span>
					{/if}
				</button>
				<div class="toggle-arrow">
					<ArrowRight size={16} />
				</div>
				<button
					class="type-btn"
					class:active={targetType === 'invoice'}
					class:source={sourceDocument.type === 'invoice'}
					onclick={() => (targetType = 'invoice')}
					type="button"
				>
					<FileText size={18} />
					{$t('review.invoice')}
					{#if sourceDocument.type === 'invoice'}
						<span class="current-badge">{$t('review.current')}</span>
					{/if}
				</button>
			</div>
			<p class="conversion-note">
				{#if sourceDocument.type === targetType}
					{$t('review.selectDifferentType')}
				{:else}
					{$t('review.convertFromTo', { from: sourceDocument.type, to: targetType })}
				{/if}
			</p>
		</div>
	</section>

	<!-- Preview Section -->
	<section
		class="section preview-section"
		in:fly={{ y: 10, duration: 200, easing: cubicOut, delay: 100 }}
	>
		<h2 class="section-title">{$t('recording.preview')}</h2>

		<p class="summary-text">{summaryText}</p>

		<div class="preview-card">
			<div class="preview-icon">
				{#if effectiveType === 'invoice'}
					<FileText size={18} strokeWidth={1.5} />
				{:else}
					<ClipboardList size={18} strokeWidth={1.5} />
				{/if}
			</div>

			<div class="preview-info">
				<p class="preview-label">
					{effectiveType === 'invoice' ? $t('review.invoice') : $t('review.estimate')}
				</p>
				<p class="preview-status">
					{$t('review.forClient', { client: sourceDocument.clientName })}
				</p>
			</div>

			<div class="preview-amount">
				{formatCurrency(sourceDocument.total)}
			</div>
		</div>
	</section>

	<!-- Action Buttons -->
	<div class="actions" in:fly={{ y: 10, duration: 200, easing: cubicOut, delay: 150 }}>
		<button class="back-btn" onclick={onBack} type="button" disabled={isProcessing}>
			<ArrowLeft size={18} />
			{$t('review.back')}
		</button>

		<button
			class="execute-btn"
			onclick={handleExecute}
			type="button"
			disabled={!isValid || isProcessing}
		>
			{#if isProcessing}
				<Loader2 size={20} class="spinning" />
				{$t('review.converting')}
			{:else}
				<Check size={20} />
				{$t('review.convertDocument')}
			{/if}
		</button>
	</div>
</div>

<style>
	.transform-review {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-bottom: 100px;
	}

	/* Section Base */
	.section {
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 16px;
		padding: 20px;
	}

	.section-title {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gray-500, #64748b);
		margin: 0 0 16px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
		border-radius: 10px;
	}

	.section-title-inline {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0;
	}

	/* Source Card */
	.source-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.6);
		border-radius: 12px;
	}

	.source-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
		border-radius: 12px;
		flex-shrink: 0;
	}

	.source-info {
		flex: 1;
		min-width: 0;
	}

	.source-type {
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0 0 2px;
	}

	.source-client {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		margin: 0;
	}

	.source-total {
		font-size: 18px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		flex-shrink: 0;
	}

	/* Conversion Content */
	.conversion-content {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.type-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.type-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 18px 14px;
		background: rgba(255, 255, 255, 0.6);
		border: 2px solid transparent;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-600, #475569);
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 80px;
		position: relative;
	}

	.type-btn:hover {
		background: rgba(255, 255, 255, 0.8);
	}

	.type-btn.active {
		border-color: var(--blu-primary, #0066ff);
		background: rgba(0, 102, 255, 0.08);
		color: var(--blu-primary, #0066ff);
	}

	.type-btn.source.active {
		border-color: var(--gray-300, #d1d5db);
		background: rgba(0, 0, 0, 0.03);
		color: var(--gray-500, #64748b);
	}

	.current-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--gray-400, #94a3b8);
		padding: 2px 6px;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 4px;
	}

	.toggle-arrow {
		color: var(--gray-400, #94a3b8);
		flex-shrink: 0;
	}

	.conversion-note {
		font-size: 13px;
		color: var(--gray-500, #64748b);
		text-align: center;
		margin: 16px 0 0;
	}

	/* Preview Section */
	.preview-section {
		background: rgba(255, 255, 255, 0.7);
	}

	.summary-text {
		font-size: 14px;
		color: var(--gray-600, #475569);
		margin: 0 0 16px;
		padding: 12px 14px;
		background: rgba(0, 102, 255, 0.05);
		border-radius: 10px;
	}

	.preview-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 12px;
	}

	.preview-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 102, 255, 0.1);
		color: var(--blu-primary, #0066ff);
		border-radius: 10px;
		flex-shrink: 0;
	}

	.preview-info {
		flex: 1;
		min-width: 0;
	}

	.preview-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-900, #0f172a);
		margin: 0 0 2px;
	}

	.preview-status {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--gray-500, #64748b);
		margin: 0;
	}

	.preview-amount {
		font-size: 15px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		flex-shrink: 0;
	}

	/* Actions */
	.actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		gap: 12px;
		padding: 16px 20px;
		padding-bottom: calc(16px + var(--safe-area-bottom, 0px));
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(0, 0, 0, 0.06);
		z-index: 100;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 16px 24px;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 14px;
		font-size: 15px;
		font-weight: 600;
		color: var(--gray-700, #334155);
		cursor: pointer;
		transition: all 0.15s ease;
		min-height: 56px;
	}

	.back-btn:hover:not(:disabled) {
		background: white;
		border-color: rgba(0, 0, 0, 0.15);
	}

	.back-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.execute-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px 24px;
		background: var(--blu-primary, #0066ff);
		color: white;
		border: none;
		border-radius: 14px;
		font-size: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
		min-height: 56px;
	}

	.execute-btn:hover:not(:disabled) {
		background: #0052cc;
		transform: translateY(-1px);
		box-shadow: 0 8px 24px rgba(0, 102, 255, 0.3);
	}

	.execute-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.execute-btn:disabled {
		background: var(--gray-300, #d1d5db);
		color: var(--gray-500, #64748b);
		cursor: not-allowed;
		box-shadow: none;
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.spinning) {
			animation: none;
		}
	}

	/* Responsive */
	@media (max-width: 400px) {
		.section {
			padding: 16px;
		}

		.type-toggle {
			flex-direction: column;
		}

		.toggle-arrow {
			transform: rotate(90deg);
		}

		.actions {
			flex-direction: column;
			padding: 12px 16px;
		}

		.back-btn {
			order: 1;
		}
	}
</style>
