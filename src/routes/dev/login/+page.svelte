<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import Terminal from 'lucide-svelte/icons/terminal';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import LogIn from 'lucide-svelte/icons/log-in';
	import UserPlus from 'lucide-svelte/icons/user-plus';
	import AlertCircle from 'lucide-svelte/icons/alert-circle';
	import CheckCircle from 'lucide-svelte/icons/check-circle';

	let { form } = $props();

	let loading = $state(false);
	let mode = $state<'login' | 'signup'>('login');
</script>

<div class="dev-login-page">
	<div class="dev-banner">
		<Terminal size={16} />
		<span>Development Mode Only</span>
	</div>

	<div class="login-container">
		<div class="login-header">
			<h1 class="login-title">Dev Login</h1>
			<p class="login-subtitle">Quick authentication for localhost development</p>
		</div>

		<div class="login-card">
			<!-- Mode Toggle -->
			<div class="mode-toggle">
				<button class="toggle-btn" class:active={mode === 'login'} onclick={() => (mode = 'login')}>
					<LogIn size={16} />
					Sign In
				</button>
				<button
					class="toggle-btn"
					class:active={mode === 'signup'}
					onclick={() => (mode = 'signup')}
				>
					<UserPlus size={16} />
					Sign Up
				</button>
			</div>

			<form
				method="POST"
				action={mode === 'login' ? '?/login' : '?/signup'}
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="form-group">
					<label for="email" class="form-label">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						value={form?.email ?? 'dev@example.com'}
						placeholder="dev@example.com"
						class="form-input"
						required
						autocomplete="email"
					/>
				</div>

				<div class="form-group">
					<label for="password" class="form-label">Password</label>
					<input
						type="password"
						id="password"
						name="password"
						value="devpass123"
						placeholder="••••••••"
						class="form-input"
						required
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						minlength="6"
					/>
				</div>

				<button type="submit" disabled={loading} class="submit-btn">
					{#if loading}
						<Loader2 size={20} class="spinner" />
					{:else if mode === 'login'}
						<LogIn size={20} />
					{:else}
						<UserPlus size={20} />
					{/if}
					<span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
				</button>
			</form>

			{#if form?.error}
				<div class="message error" in:fly={{ y: 10, duration: 200 }}>
					<AlertCircle size={16} />
					<p>{form.error}</p>
				</div>
			{/if}

			{#if form?.success}
				<div class="message success" in:fly={{ y: 10, duration: 200 }}>
					<CheckCircle size={16} />
					<p>{form.message}</p>
				</div>
			{/if}

			<div class="divider">
				<span>Tips</span>
			</div>

			<div class="tips">
				<p>1. Create an account with any email (e.g., <code>dev@example.com</code>)</p>
				<p>2. Supabase may auto-confirm in dev mode, or check your email</p>
				<p>3. Default password suggestion: <code>devpass123</code></p>
			</div>
		</div>

		<a href="/login" class="production-link"> Use production login (magic link) → </a>
	</div>
</div>

<style>
	.dev-login-page {
		min-height: 100vh;
		min-height: 100dvh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.dev-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 100px;
		color: #fbbf24;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 24px;
	}

	.login-container {
		width: 100%;
		max-width: 400px;
	}

	.login-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.login-title {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 28px;
		font-weight: 700;
		color: #10b981;
		margin: 0;
	}

	.login-subtitle {
		margin-top: 8px;
		font-size: 14px;
		color: #94a3b8;
	}

	.login-card {
		background: rgba(30, 41, 59, 0.8);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		padding: 28px;
		border-radius: 16px;
		border: 1px solid rgba(148, 163, 184, 0.1);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	}

	.mode-toggle {
		display: flex;
		gap: 8px;
		margin-bottom: 24px;
		padding: 4px;
		background: rgba(15, 23, 42, 0.5);
		border-radius: 10px;
	}

	.toggle-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: #94a3b8;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-btn:hover:not(.active) {
		color: #e2e8f0;
	}

	.toggle-btn.active {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: #94a3b8;
		margin-bottom: 6px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}

	.form-input {
		width: 100%;
		padding: 12px 14px;
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(15, 23, 42, 0.6);
		color: #e2e8f0;
		border-radius: 10px;
		font-size: 15px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		outline: none;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
	}

	.form-input::placeholder {
		color: #64748b;
	}

	.submit-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 14px 24px;
		margin-top: 8px;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.submit-btn :global(.spinner) {
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

	.message {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin-top: 16px;
		padding: 12px 14px;
		border-radius: 10px;
		font-size: 14px;
	}

	.message p {
		margin: 0;
		line-height: 1.4;
	}

	.message.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #f87171;
	}

	.message.success {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		color: #34d399;
	}

	.divider {
		display: flex;
		align-items: center;
		margin: 24px 0 16px;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: rgba(148, 163, 184, 0.2);
	}

	.divider span {
		padding: 0 12px;
		font-size: 12px;
		font-weight: 500;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.tips {
		font-size: 13px;
		color: #94a3b8;
		line-height: 1.6;
	}

	.tips p {
		margin: 0 0 8px;
	}

	.tips code {
		padding: 2px 6px;
		background: rgba(16, 185, 129, 0.1);
		border-radius: 4px;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 12px;
		color: #10b981;
	}

	.production-link {
		display: block;
		margin-top: 20px;
		text-align: center;
		font-size: 14px;
		color: #64748b;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.production-link:hover {
		color: #0ea5e9;
	}
</style>
