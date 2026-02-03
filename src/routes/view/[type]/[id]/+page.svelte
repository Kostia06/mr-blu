<script lang="ts">
	import Download from 'lucide-svelte/icons/download';
	import DocumentTemplate from '$lib/components/DocumentTemplate.svelte';

	let { data } = $props();
	const document = $derived(data.document);

	let isGenerating = $state(false);

	// Download PDF via server-side puppeteer rendering
	async function handleDownload() {
		if (isGenerating) return;
		isGenerating = true;

		try {
			const response = await fetch('/api/documents/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...document, shareToken: data.shareToken })
			});

			if (!response.ok) throw new Error('PDF generation failed');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = window.document.createElement('a');
			link.href = url;
			link.download = `${document.documentType}-${document.documentNumber}.pdf`;
			window.document.body.appendChild(link);
			link.click();
			window.document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to generate PDF:', error);
			alert('Failed to generate PDF. Please try again.');
		} finally {
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>{document.documentType} {document.documentNumber} | Mr.Blu</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="view-page">
	<div class="document-container">
		<!-- Header -->
		<header class="doc-header">
			<span class="brand-name">Mr.Blu</span>
			<button class="download-btn" onclick={handleDownload} disabled={isGenerating}>
				<Download size={18} />
				<span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
			</button>
		</header>

		<!-- Visible Document Template (for web view) -->
		<DocumentTemplate {document} />
	</div>
</main>

<style>
	.view-page {
		min-height: 100vh;
		background: #f8fafc;
		padding: 24px 16px;
	}

	.document-container {
		max-width: 680px;
		margin: 0 auto;
	}

	/* Header */
	.doc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.brand-name {
		font-family: var(--font-display, system-ui);
		font-size: 20px;
		font-weight: 700;
		color: var(--blu-primary, #0066ff);
		letter-spacing: -0.02em;
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: #0066ff;
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.download-btn:hover:not(:disabled) {
		background: #0052cc;
		transform: translateY(-1px);
	}

	.download-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Mobile */
	@media (max-width: 600px) {
		.view-page {
			padding: 16px 12px;
		}

		.download-btn span {
			display: none;
		}

		.download-btn {
			padding: 10px;
		}
	}
</style>
