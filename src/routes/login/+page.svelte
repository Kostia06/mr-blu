<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Mail from 'lucide-svelte/icons/mail';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Send from 'lucide-svelte/icons/send';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import { t } from '$lib/i18n';

	let { data, form } = $props();

	let loading = $state(false);
	let visible = $state(false);
	let resendCountdown = $state(0);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;
	let sentEmail = $state('');

	// Translate error keys from server
	const translatedError = $derived(() => {
		const errorKey = form?.error || data.urlError;
		if (!errorKey) return null;

		// Handle rate limit error with interpolation
		if (errorKey === 'auth.tooManyAttempts' && (form as any)?.retryAfter) {
			return $t('auth.tooManyAttempts').replace('{seconds}', String((form as any).retryAfter));
		}

		// Translate the error key
		const translated = $t(errorKey);
		// If translation returns the key itself, it means no translation exists
		return translated !== errorKey ? translated : errorKey;
	});

	const RESEND_DELAY = 60; // seconds

	function startResendTimer() {
		resendCountdown = RESEND_DELAY;
		if (countdownInterval) clearInterval(countdownInterval);
		countdownInterval = setInterval(() => {
			resendCountdown--;
			if (resendCountdown <= 0) {
				if (countdownInterval) clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	// Watch for success and start timer
	$effect(() => {
		if (form?.success && form?.email) {
			sentEmail = form.email;
			startResendTimer();
		}
	});

	onMount(() => {
		requestAnimationFrame(() => {
			visible = true;
		});

		// Clear URL error from address bar to prevent showing on refresh
		if (data.urlError) {
			history.replaceState(null, '', '/login');
		}
	});

	onDestroy(() => {
		if (countdownInterval) clearInterval(countdownInterval);
	});
</script>

<div class="login-page">
	<!-- Background Blobs -->
	<div class="bg-decoration" aria-hidden="true">
		<div class="blob blob-1"></div>
		<div class="blob blob-2"></div>
		<div class="blob blob-3"></div>
	</div>

	<div class="login-container" class:visible>
		<!-- Header -->
		<div class="login-header">
			<h1 class="login-title">mrblu</h1>
			<p class="login-subtitle">{$t('auth.signIn')}</p>
		</div>

		<!-- Login Card -->
		<div class="login-card">
			{#if form?.success}
				<!-- Success State -->
				<div class="success-state" in:fade={{ duration: 300 }}>
					<div class="success-icon">
						<Send size={32} strokeWidth={1.5} />
					</div>
					<h2 class="success-title">{$t('auth.checkEmail')}</h2>
					<p class="success-text">{$t('auth.magicLinkSent')}</p>

					<!-- Resend Section -->
					<div class="resend-section">
						{#if resendCountdown > 0}
							<p class="resend-timer">
								{$t('auth.resendIn')} <span class="countdown">{resendCountdown}s</span>
							</p>
						{:else}
							<form
								method="POST"
								action="?/login"
								use:enhance={() => {
									loading = true;
									return async ({ update }) => {
										await update();
										loading = false;
										startResendTimer();
									};
								}}
							>
								<input type="hidden" name="email" value={sentEmail} />
								<button type="submit" disabled={loading} class="resend-btn">
									{#if loading}
										<Loader2 size={16} strokeWidth={2} class="spinner" />
									{:else}
										<RefreshCw size={16} strokeWidth={2} />
									{/if}
									<span>{$t('auth.resendEmail')}</span>
								</button>
							</form>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Login Form -->
				<form
					method="POST"
					action="?/login"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					<div class="form-group">
						<label for="email" class="form-label">
							{$t('auth.email')}
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={form?.email ?? ''}
							placeholder={$t('auth.emailPlaceholder')}
							class="form-input"
							required
							autocomplete="email"
						/>
					</div>

					<button type="submit" disabled={loading} class="submit-btn">
						{#if loading}
							<Loader2 size={20} strokeWidth={2} class="spinner" />
						{:else}
							<Mail size={20} strokeWidth={2} />
						{/if}
						<span>{$t('auth.sendMagicLink')}</span>
					</button>

					<p class="terms-notice">
						{$t('auth.termsNotice')} <a href="/terms" target="_blank">{$t('auth.termsOfService')}</a> {$t('auth.and')} <a href="/privacy" target="_blank">{$t('auth.privacyPolicy')}</a>.
					</p>
				</form>

				{#if translatedError()}
					<div class="message error" in:fly={{ y: 10, duration: 200 }}>
						<p>{translatedError()}</p>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Back Link -->
		<a href="/" class="back-link">
			<ArrowLeft size={16} strokeWidth={2} />
			<span>{$t('auth.backHome')}</span>
		</a>
	</div>
</div>

<style>
	.login-page {
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
		background: var(--white, #dbe8f4);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px;
		overflow: hidden;
	}

	/* Background Decoration */
	.bg-decoration {
		position: fixed;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
	}

	.blob-1 {
		width: 500px;
		height: 500px;
		background: linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%);
		opacity: 0.25;
		top: -150px;
		right: -100px;
		animation: float 20s ease-in-out infinite;
	}

	.blob-2 {
		width: 400px;
		height: 400px;
		background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
		opacity: 0.2;
		bottom: -100px;
		left: -100px;
		animation: float 25s ease-in-out infinite reverse;
	}

	.blob-3 {
		width: 300px;
		height: 300px;
		background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
		opacity: 0.15;
		top: 40%;
		left: 50%;
		transform: translateX(-50%);
		animation: float 18s ease-in-out infinite;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(30px, -30px) scale(1.05);
		}
		66% {
			transform: translate(-20px, 20px) scale(0.95);
		}
	}

	/* Container */
	.login-container {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 400px;
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.login-container.visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Header */
	.login-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.login-title {
		font-family: var(--font-display, system-ui);
		font-size: 32px;
		font-weight: 700;
		color: var(--blu-primary, #0066ff);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.login-subtitle {
		margin-top: 8px;
		font-size: 16px;
		color: var(--gray-500, #64748b);
	}

	/* Card */
	.login-card {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		padding: 32px;
		border-radius: 24px;
		border: 1px solid rgba(255, 255, 255, 0.8);
		box-shadow:
			0 4px 24px rgba(0, 102, 255, 0.08),
			0 1px 3px rgba(0, 0, 0, 0.04);
	}

	/* Form */
	.form-group {
		margin-bottom: 20px;
	}

	.form-label {
		display: block;
		font-size: 14px;
		font-weight: 600;
		color: var(--gray-700, #334155);
		margin-bottom: 8px;
	}

	.form-input {
		width: 100%;
		padding: 14px 16px;
		border: 1px solid var(--gray-200, #e2e8f0);
		background: rgba(255, 255, 255, 0.8);
		color: var(--gray-900, #0f172a);
		border-radius: 14px;
		font-size: 16px;
		outline: none;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		border-color: var(--blu-primary, #0066ff);
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 0 0 4px rgba(0, 102, 255, 0.1);
	}

	.form-input::placeholder {
		color: var(--gray-400, #94a3b8);
	}

	/* Submit Button */
	.submit-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px 24px;
		background: linear-gradient(135deg, var(--blu-primary, #0066ff) 0%, #0ea5e9 100%);
		color: white;
		border: none;
		border-radius: 14px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 16px rgba(0, 102, 255, 0.3);
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 24px rgba(0, 102, 255, 0.4);
	}

	.submit-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.submit-btn :global(.spinner),
	.resend-btn :global(.spinner) {
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

	/* Success State */
	.success-state {
		text-align: center;
		padding: 24px 0;
	}

	.success-icon {
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(14, 165, 233, 0.1) 100%);
		border-radius: 50%;
		color: var(--data-green, #10b981);
		margin: 0 auto 20px;
	}

	.success-title {
		font-family: var(--font-display, system-ui);
		font-size: 20px;
		font-weight: 700;
		color: var(--gray-900, #0f172a);
		margin: 0 0 8px;
	}

	.success-text {
		font-size: 15px;
		color: var(--gray-500, #64748b);
		margin: 0;
		line-height: 1.5;
	}

	/* Resend Section */
	.resend-section {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--gray-200, #e2e8f0);
	}

	.resend-timer {
		font-size: 14px;
		color: var(--gray-500, #64748b);
		margin: 0;
	}

	.countdown {
		font-weight: 600;
		color: var(--blu-primary, #0066ff);
		font-variant-numeric: tabular-nums;
	}

	.resend-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 20px;
		background: transparent;
		color: var(--blu-primary, #0066ff);
		border: 1px solid var(--blu-primary, #0066ff);
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.resend-btn:hover:not(:disabled) {
		background: rgba(0, 102, 255, 0.05);
	}

	.resend-btn:active:not(:disabled) {
		transform: scale(0.98);
	}

	.resend-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Terms Notice */
	.terms-notice {
		font-size: 12px;
		color: var(--gray-400, #94a3b8);
		text-align: center;
		margin: 16px 0 0;
		line-height: 1.5;
	}

	.terms-notice a {
		color: var(--gray-500, #64748b);
		text-decoration: underline;
	}

	.terms-notice a:hover {
		color: var(--blu-primary, #0066ff);
	}

	/* Messages */
	.message {
		margin-top: 20px;
		padding: 14px 16px;
		border-radius: 12px;
		font-size: 14px;
		text-align: center;
	}

	.message.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.message.error p {
		color: var(--data-red, #ef4444);
		margin: 0;
	}

	/* Back Link */
	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		margin-top: 28px;
		font-size: 14px;
		font-weight: 500;
		color: var(--gray-500, #64748b);
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.back-link:hover {
		color: var(--blu-primary, #0066ff);
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		.login-container {
			opacity: 1;
			transform: none;
			transition: none;
		}

		.blob {
			animation: none;
		}

		.submit-btn :global(.spinner),
		.resend-btn :global(.spinner) {
			animation: none;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.login-page {
			padding: 20px;
		}

		.login-card {
			padding: 24px;
			border-radius: 20px;
		}

		.form-input {
			padding: 16px;
		}

		.submit-btn {
			padding: 16px 20px;
		}
	}
</style>
