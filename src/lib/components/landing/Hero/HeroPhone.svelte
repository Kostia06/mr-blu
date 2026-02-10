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

	// Current time for status bar
	const currentTime = $derived.by(() => {
		const now = new Date();
		return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
	});
</script>

<div class="hero-phone-container" bind:this={phoneRef}>
	<div class="phone-3d-wrapper">
	<!-- iPhone Frame -->
	<div class="iphone-frame">
		<!-- Titanium edge highlights -->
		<div class="frame-highlight frame-highlight-left"></div>
		<div class="frame-highlight frame-highlight-right"></div>
		<div class="frame-highlight frame-highlight-top"></div>

		<!-- Side buttons -->
		<div class="side-button volume-up"></div>
		<div class="side-button volume-down"></div>
		<div class="side-button silent-switch"></div>
		<div class="side-button power-button"></div>

		<!-- Screen bezel -->
		<div class="screen-bezel">
			<!-- Glass reflection overlay -->
			<div class="glass-reflection"></div>

			<!-- Dynamic Island -->
			<div class="dynamic-island">
				<div class="island-camera"></div>
				<div class="island-sensor"></div>
			</div>

			<!-- Status Bar -->
			<div class="status-bar">
				<span class="status-time">{currentTime}</span>
				<div class="status-right">
					<div class="signal-bars">
						<div class="bar bar-1"></div>
						<div class="bar bar-2"></div>
						<div class="bar bar-3"></div>
						<div class="bar bar-4"></div>
					</div>
					<div class="wifi-icon">
						<svg viewBox="0 0 16 12" fill="currentColor">
							<path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-3.5-2.3a5 5 0 017 0l-.9.9a3.7 3.7 0 00-5.2 0l-.9-.9zm-2.1-2.1a7.5 7.5 0 0111.2 0l-.9.9a6.2 6.2 0 00-9.4 0l-.9-.9z"/>
						</svg>
					</div>
					<div class="battery">
						<div class="battery-body">
							<div class="battery-level"></div>
						</div>
						<div class="battery-cap"></div>
					</div>
				</div>
			</div>

			<!-- Phone screen content -->
			<div class="phone-screen">
				<!-- Background blobs (like dashboard) -->
				<div class="screen-blobs">
					<div class="screen-blob blob-1"></div>
					<div class="screen-blob blob-2"></div>
					<div class="screen-blob blob-3"></div>
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
									<div class="gradient-pulse"></div>
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

				<!-- Bottom Nav -->
				<div class="bottom-nav-wrapper">
					<div class="bottom-nav">
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

					<!-- Home indicator -->
					<div class="home-indicator"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Realistic shadow -->
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
		max-width: 240px;
		margin: 0 auto;
		overflow: visible;
		perspective: 1000px;
	}

	@media (min-width: 480px) {
		.hero-phone-container {
			max-width: 280px;
		}
	}

	@media (min-width: 768px) {
		.hero-phone-container {
			max-width: 320px;
		}
	}

	@media (min-width: 1024px) {
		.hero-phone-container {
			max-width: 350px;
		}
	}

	.phone-3d-wrapper {
		position: relative;
		transform-style: preserve-3d;
		will-change: transform, opacity;
		animation: phone-entrance 1s ease-out forwards;
	}

	.hero-phone-container:hover .phone-3d-wrapper {
		transform: rotateY(4deg) rotateX(3deg) translateY(-5px);
	}

	@keyframes phone-entrance {
		0% {
			opacity: 0;
			transform: translateY(60px) scale(0.95);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* iPhone Frame - Clean solid */
	.iphone-frame {
		position: relative;
		background: #1c1c1e;
		border-radius: 52px;
		padding: 3px;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.4),
			0 12px 24px -8px rgba(0, 0, 0, 0.2);
	}

	/* Frame highlights - hidden for clean look */
	.frame-highlight {
		display: none;
	}

	/* Side buttons */
	.side-button {
		position: absolute;
		background: #2a2a2e;
		border-radius: 2px;
		z-index: 10;
	}

	.silent-switch {
		left: -2px;
		top: 100px;
		width: 3px;
		height: 28px;
	}

	.volume-up {
		left: -2px;
		top: 145px;
		width: 3px;
		height: 45px;
	}

	.volume-down {
		left: -2px;
		top: 200px;
		width: 3px;
		height: 45px;
	}

	.power-button {
		right: -2px;
		top: 160px;
		width: 3px;
		height: 65px;
	}

	/* Screen bezel */
	.screen-bezel {
		position: relative;
		background: #dbe8f4;
		border-radius: 49px;
		overflow: hidden;
		aspect-ratio: 9 / 19.5;
		/* Safari: force compositing layer to clip blurred blobs */
		-webkit-mask-image: -webkit-radial-gradient(white, white);
		transform: translateZ(0);
	}

	/* Glass reflection - hidden for clean look */
	.glass-reflection {
		display: none;
	}

	/* Dynamic Island */
	.dynamic-island {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 34px;
		background: #000;
		border-radius: 20px;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0 10px;
		gap: 6px;
		box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3);
	}

	.island-camera {
		width: 10px;
		height: 10px;
		background: #0a0a15;
		border-radius: 50%;
	}

	.island-sensor {
		width: 6px;
		height: 6px;
		background: #0a0a12;
		border-radius: 50%;
	}

	/* Status Bar */
	.status-bar {
		position: absolute;
		top: 14px;
		left: 24px;
		right: 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		z-index: 40;
		height: 20px;
	}

	.status-time {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
		font-feature-settings: 'tnum';
	}

	.status-right {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.signal-bars {
		display: flex;
		align-items: flex-end;
		gap: 1px;
		height: 10px;
	}

	.signal-bars .bar {
		width: 3px;
		background: #0f172a;
		border-radius: 1px;
	}

	.bar-1 { height: 3px; }
	.bar-2 { height: 5px; }
	.bar-3 { height: 7px; }
	.bar-4 { height: 10px; }

	.wifi-icon {
		width: 14px;
		height: 10px;
		color: #0f172a;
	}

	.wifi-icon svg {
		width: 100%;
		height: 100%;
	}

	.battery {
		display: flex;
		align-items: center;
	}

	.battery-body {
		width: 22px;
		height: 11px;
		border: 1.5px solid #0f172a;
		border-radius: 3px;
		padding: 1px;
	}

	.battery-level {
		width: 80%;
		height: 100%;
		background: #0f172a;
		border-radius: 1px;
	}

	.battery-cap {
		width: 1.5px;
		height: 5px;
		background: #0f172a;
		border-radius: 0 1px 1px 0;
		margin-left: 0.5px;
	}

	/* Phone screen content */
	.phone-screen {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-top: 50px;
		position: relative;
		overflow: hidden;
	}

	/* Background blobs - static for performance */
	.screen-blobs {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		/* Safari: clip blurred blobs within phone screen */
		-webkit-mask-image: -webkit-radial-gradient(white, white);
	}

	.screen-blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(35px);
		opacity: 0.35;
	}

	.screen-blob.blob-1 {
		width: 140px;
		height: 140px;
		background: #0066ff;
		top: -30px;
		right: -40px;
	}

	.screen-blob.blob-2 {
		width: 110px;
		height: 110px;
		background: #0ea5e9;
		bottom: 20%;
		left: -30px;
	}

	.screen-blob.blob-3 {
		width: 90px;
		height: 90px;
		background: #6366f1;
		bottom: -20px;
		right: 20%;
	}

	/* Dashboard Header */
	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 8px 18px 12px;
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
		background: #0066ff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 14px;
		font-weight: 700;
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
		display: none;
	}

	.orb {
		position: relative;
		width: 100px;
		height: 100px;
		border-radius: 50%;
		overflow: hidden;
		-webkit-mask-image: -webkit-radial-gradient(white, white);
		background: radial-gradient(
			ellipse at 50% 40%,
			#bae6fd 0%,
			#7dd3fc 20%,
			#38bdf8 40%,
			#0ea5e9 60%,
			#0284c7 80%,
			#0369a1 100%
		);
		box-shadow:
			0 8px 40px rgba(14, 165, 233, 0.35),
			0 0 60px rgba(56, 189, 248, 0.2),
			inset 0 0 40px rgba(186, 230, 253, 0.3);
	}

	/* Cloud texture layers — matches dashboard RecordButtonMobile */
	.cloud-layer {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		pointer-events: none;
		mix-blend-mode: soft-light;
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

	/* Bottom Nav */
	.bottom-nav-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px;
		padding-bottom: 8px;
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
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
		transition: color 0.2s ease;
	}

	.nav-item:hover {
		color: #475569;
	}

	.nav-item.active {
		color: #0066ff;
	}

	/* Home indicator */
	.home-indicator {
		width: 120px;
		height: 4px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 2px;
		margin-top: 8px;
	}

	/* Phone shadow - simplified */
	.phone-shadow {
		position: absolute;
		bottom: -30px;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		height: 40px;
		background: rgba(0, 0, 0, 0.15);
		filter: blur(20px);
		z-index: -1;
		border-radius: 50%;
	}

	@keyframes fade-in {
		to { opacity: 1; }
	}

	/* Floating notifications */
	.notification {
		position: absolute;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 12px;
		box-shadow:
			0 4px 20px rgba(0, 0, 0, 0.1),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		opacity: 0;
		transform: translateX(20px);
	}

	.notification-success {
		top: 15%;
		right: -15px;
		color: #10b981;
		animation: slide-in 0.4s ease-out 1.1s forwards;
	}

	.notification-sent {
		bottom: 25%;
		right: -20px;
		color: #0066ff;
		animation: slide-in 0.4s ease-out 1.3s forwards;
	}

	@keyframes slide-in {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Responsive - hide notifications on smaller screens */
	@media (max-width: 768px) {
		.notification {
			display: none;
		}

		.dynamic-island {
			width: 100px;
			height: 30px;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.phone-3d-wrapper {
			animation: none;
			transform: rotateY(8deg) rotateX(5deg);
		}

		.phone-shadow {
			animation: none;
			opacity: 1;
		}

		.notification {
			animation: none;
			opacity: 1;
			transform: none;
		}

		.indicator {
			transition: none;
		}
	}
</style>
