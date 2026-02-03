<script lang="ts">
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import Mic from 'lucide-svelte/icons/mic';
	import FileText from 'lucide-svelte/icons/file-text';
	import Settings from 'lucide-svelte/icons/settings';
	import Keyboard from 'lucide-svelte/icons/keyboard';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import User from 'lucide-svelte/icons/user';
	import Bell from 'lucide-svelte/icons/bell';
	import Moon from 'lucide-svelte/icons/moon';
	import Shield from 'lucide-svelte/icons/shield';
	import { t } from '$lib/i18n';

	let phoneRef: HTMLDivElement;
	let activeTab = $state<'documents' | 'record' | 'settings'>('record');

	// Get active index for indicator position (matches BottomNav.svelte)
	const activeIndex = $derived.by(() => {
		if (activeTab === 'documents') return 0;
		if (activeTab === 'record') return 1;
		if (activeTab === 'settings') return 2;
		return 1;
	});

	// Sample documents for the documents tab (reactive for i18n)
	const documents = $derived([
		{
			type: $t('landing.phone.invoice'),
			typeKey: 'invoice',
			client: 'ABC Corp',
			amount: '$1,250',
			date: $t('landing.phone.today')
		},
		{
			type: $t('landing.phone.estimate'),
			typeKey: 'estimate',
			client: 'Smith Home',
			amount: '$3,400',
			date: $t('landing.phone.yesterday')
		},
		{
			type: $t('landing.phone.receipt'),
			typeKey: 'receipt',
			client: 'Johnson LLC',
			amount: '$890',
			date: $t('landing.phone.daysAgo').replace('{n}', '2')
		}
	]);

	// Settings items (reactive for i18n)
	const settingsItems = $derived([
		{ icon: User, label: $t('landing.phone.profile'), value: 'Mike R.' },
		{ icon: Bell, label: $t('landing.phone.notifications'), value: $t('landing.phone.on') },
		{ icon: Moon, label: $t('landing.phone.darkMode'), value: $t('landing.phone.off') },
		{ icon: Shield, label: $t('landing.phone.security'), value: '' }
	]);
</script>

<!-- Mobile-only title -->
<div class="hero-phone-container" bind:this={phoneRef}>
	<div class="phone-frame">
		<!-- Phone notch -->
		<div class="phone-notch"></div>

		<!-- Phone screen -->
		<div class="phone-screen">
			<!-- Dashboard Header -->
			<div class="dashboard-header">
				<div class="greeting">
					<span class="greeting-text">{$t('landing.phone.greeting')}</span>
					<span class="user-name">{$t('landing.phone.userName')}</span>
				</div>
				<div class="avatar">
					<span>M</span>
				</div>
			</div>

			<!-- Content Area -->
			<div class="content-area">
				{#if activeTab === 'record'}
					<!-- Record Section -->
					<div class="record-section">
						<!-- Cloud Orb Button -->
						<div class="record-btn-wrapper">
							<div class="glow-ring"></div>
							<div class="orb">
								<!-- ChatGPT-style rotating gradient layers -->
								<div class="gradient-pulse"></div>
								<!-- Cloud texture layers -->
								<div class="cloud-layer layer-1"></div>
								<div class="cloud-layer layer-2"></div>
								<div class="cloud-layer layer-3"></div>
								<div class="ambient-light"></div>
							</div>
						</div>

						<p class="record-hint">{$t('landing.phone.tapToRecord')}</p>

						<button class="type-option">
							<Keyboard size={12} strokeWidth={2} />
							<span>{$t('landing.phone.orTypeInstead')}</span>
						</button>
					</div>
				{:else if activeTab === 'documents'}
					<!-- Documents Section -->
					<div class="documents-section">
						<div class="section-header">
							<h3 class="section-title">{$t('landing.phone.recent')}</h3>
							<button class="see-all">{$t('landing.phone.seeAll')}</button>
						</div>
						<div class="documents-list">
							{#each documents as doc}
								<div class="document-item">
									<div
										class="doc-icon"
										class:invoice={doc.typeKey === 'invoice'}
										class:estimate={doc.typeKey === 'estimate'}
										class:receipt={doc.typeKey === 'receipt'}
									>
										<FileText size={14} strokeWidth={2} />
									</div>
									<div class="doc-info">
										<span class="doc-type">{doc.type}</span>
										<span class="doc-client">{doc.client}</span>
									</div>
									<div class="doc-meta">
										<span class="doc-amount">{doc.amount}</span>
										<span class="doc-date">{doc.date}</span>
									</div>
									<ChevronRight size={14} class="doc-arrow" />
								</div>
							{/each}
						</div>
					</div>
				{:else if activeTab === 'settings'}
					<!-- Settings Section -->
					<div class="settings-section">
						<div class="settings-list">
							{#each settingsItems as item}
								<div class="settings-item">
									<div class="settings-icon">
										<item.icon size={16} strokeWidth={2} />
									</div>
									<span class="settings-label">{item.label}</span>
									{#if item.value}
										<span class="settings-value">{item.value}</span>
									{/if}
									<ChevronRight size={14} class="settings-arrow" />
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Nav - Glass pill with indicator (exact replica of BottomNav) -->
			<div class="bottom-nav-wrapper">
				<div class="bottom-nav">
					<!-- Animated indicator -->
					<div class="indicator" style="transform: translateX({activeIndex * 48}px)"></div>

					<button
						class="nav-item"
						class:active={activeTab === 'documents'}
						onclick={() => (activeTab = 'documents')}
					>
						<FileText size={18} strokeWidth={activeTab === 'documents' ? 2 : 1.5} />
					</button>
					<button
						class="nav-item"
						class:active={activeTab === 'record'}
						onclick={() => (activeTab = 'record')}
					>
						<Mic size={18} strokeWidth={activeTab === 'record' ? 2 : 1.5} />
					</button>
					<button
						class="nav-item"
						class:active={activeTab === 'settings'}
						onclick={() => (activeTab = 'settings')}
					>
						<Settings size={18} strokeWidth={activeTab === 'settings' ? 2 : 1.5} />
					</button>
				</div>
			</div>
		</div>

		<!-- Phone shadow -->
		<div class="phone-shadow"></div>
	</div>

	<!-- Floating notifications -->
	<div class="notification notification-success">
		<CheckCircle2 size={16} strokeWidth={2.5} />
		<span>{$t('landing.phone.invoiceCreated')}</span>
	</div>

	<div class="notification notification-sent">
		<CheckCircle2 size={16} strokeWidth={2.5} />
		<span>{$t('landing.phone.sentToClient')}</span>
	</div>
</div>

<style>
	.hero-phone-container {
		position: relative;
		width: 100%;
		max-width: 320px;
		overflow: visible;
	}

	.phone-frame {
		position: relative;
		background: linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%);
		border-radius: 40px;
		padding: 12px;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(219, 232, 244, 0.1) inset,
			0 -1px 0 0 rgba(219, 232, 244, 0.05) inset;
		transform-style: preserve-3d;
	}

	.phone-notch {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		width: 100px;
		height: 28px;
		background: #000;
		border-radius: 0 0 16px 16px;
		z-index: 10;
	}

	.phone-screen {
		background: #dbe8f4;
		border-radius: 32px;
		overflow: hidden;
		aspect-ratio: 9 / 19;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	/* Dashboard Header */
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 48px 18px 12px;
		position: relative;
		z-index: 1;
	}

	.greeting {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.greeting-text {
		font-size: 11px;
		color: #64748b;
	}

	.user-name {
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.avatar {
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 14px;
		font-weight: 700;
	}

	/* Record Section */
	.record-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 10px 20px 20px;
		gap: 14px;
		position: relative;
		z-index: 1;
	}

	/* Cloud Orb Button */
	.record-btn-wrapper {
		position: relative;
		width: 110px;
		height: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.glow-ring {
		position: absolute;
		inset: -15px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(56, 189, 248, 0.15) 0%,
			rgba(14, 165, 233, 0.08) 50%,
			transparent 70%
		);
		opacity: 0.7;
		pointer-events: none;
	}

	.orb {
		position: relative;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		background: radial-gradient(
			ellipse at 50% 40%,
			#bae6fd 0%,
			#7dd3fc 20%,
			#38bdf8 40%,
			#0ea5e9 60%,
			#0284c7 80%,
			#0369a1 100%
		);
		box-shadow: 0 8px 30px rgba(14, 165, 233, 0.3);
	}

	/* Cloud texture layers */
	.cloud-layer {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		pointer-events: none;
	}

	.cloud-layer.layer-1 {
		background:
			radial-gradient(
				ellipse 120% 100% at 30% 20%,
				rgba(219, 232, 244, 0.7) 0%,
				rgba(219, 232, 244, 0.3) 30%,
				transparent 60%
			),
			radial-gradient(ellipse 80% 60% at 70% 80%, rgba(219, 232, 244, 0.4) 0%, transparent 50%);
		opacity: 0.9;
	}

	.cloud-layer.layer-2 {
		background:
			radial-gradient(ellipse 100% 80% at 60% 30%, rgba(224, 242, 254, 0.6) 0%, transparent 50%),
			radial-gradient(ellipse 70% 90% at 20% 70%, rgba(186, 230, 253, 0.5) 0%, transparent 45%);
		opacity: 0.8;
	}

	.cloud-layer.layer-3 {
		background:
			radial-gradient(ellipse 60% 50% at 75% 25%, rgba(219, 232, 244, 0.5) 0%, transparent 40%),
			radial-gradient(ellipse 50% 70% at 35% 60%, rgba(125, 211, 252, 0.4) 0%, transparent 50%);
		opacity: 0.7;
	}

	.ambient-light {
		position: absolute;
		top: 5%;
		left: 15%;
		width: 50%;
		height: 35%;
		background: radial-gradient(
			ellipse,
			rgba(219, 232, 244, 0.4) 0%,
			rgba(219, 232, 244, 0.15) 40%,
			transparent 70%
		);
		border-radius: 50%;
		pointer-events: none;
		transform: rotate(-10deg);
		opacity: 0.8;
	}

	/* Center glow */
	.gradient-pulse {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse at center,
			rgba(186, 230, 253, 0.5) 0%,
			rgba(56, 189, 248, 0.3) 40%,
			transparent 70%
		);
		border-radius: 50%;
	}

	.record-hint {
		font-size: 11px;
		color: #94a3b8;
		margin: 0;
	}

	.type-option {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 8px 14px;
		background: rgba(219, 232, 244, 0.95);
		border: 1px solid #e2e8f0;
		border-radius: 100px;
		font-size: 10px;
		font-weight: 500;
		color: #475569;
		cursor: default;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
	}

	/* Content Area */
	.content-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	/* Documents Section */
	.documents-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 14px;
		overflow: hidden;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.section-title {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
		margin: 0;
	}

	.see-all {
		font-size: 10px;
		font-weight: 600;
		color: #0066ff;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}

	.documents-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.document-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 10px;
		border: 1px solid rgba(226, 232, 240, 0.5);
	}

	.doc-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.doc-icon.invoice {
		background: rgba(0, 102, 255, 0.1);
		color: #0066ff;
	}

	.doc-icon.estimate {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.doc-icon.receipt {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.doc-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.doc-type {
		font-size: 11px;
		font-weight: 600;
		color: #0f172a;
	}

	.doc-client {
		font-size: 9px;
		color: #64748b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 1px;
	}

	.doc-amount {
		font-size: 11px;
		font-weight: 700;
		color: #0f172a;
	}

	.doc-date {
		font-size: 8px;
		color: #94a3b8;
	}

	.document-item :global(.doc-arrow) {
		color: #cbd5e1;
		flex-shrink: 0;
	}

	/* Settings Section */
	.settings-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 14px;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.settings-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 10px;
		border: 1px solid rgba(226, 232, 240, 0.5);
	}

	.settings-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(0, 102, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #0066ff;
		flex-shrink: 0;
	}

	.settings-label {
		flex: 1;
		font-size: 11px;
		font-weight: 600;
		color: #0f172a;
	}

	.settings-value {
		font-size: 10px;
		color: #64748b;
	}

	.settings-item :global(.settings-arrow) {
		color: #cbd5e1;
		flex-shrink: 0;
	}

	/* Bottom Nav - Glass pill design (exact replica of BottomNav) */
	.bottom-nav-wrapper {
		display: flex;
		justify-content: center;
		padding: 12px;
		padding-bottom: calc(12px + 8px);
		position: relative;
		z-index: 1;
	}

	.bottom-nav {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		background: rgba(203, 218, 233, 0.85);
		padding: 6px;
		border-radius: 50px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
	}

	.indicator {
		position: absolute;
		left: 6px;
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 50%;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
	}

	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: #64748b;
		background: none;
		border: none;
		cursor: pointer;
		border-radius: 50%;
		z-index: 1;
	}

	.nav-item:hover {
		color: #475569;
	}

	.nav-item.active {
		color: #0066ff;
	}

	/* Phone shadow */
	.phone-shadow {
		position: absolute;
		bottom: -20px;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		height: 20px;
		background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, transparent 70%);
		filter: blur(10px);
	}

	/* Floating notifications */
	.notification {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: #dbe8f4;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
	}

	.notification-success {
		top: 15%;
		right: -10px;
		color: #10b981;
	}

	.notification-sent {
		bottom: 25%;
		right: -15px;
		color: #0066ff;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-phone-container {
			max-width: 280px;
		}

		.notification {
			display: none;
		}
	}
</style>
