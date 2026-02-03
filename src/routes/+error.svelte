<script lang="ts">
	import { page } from '$app/stores';

	const isLoggedIn = $derived(!!$page.data?.session);
	const homeUrl = $derived(isLoggedIn ? '/dashboard' : '/');
	const homeLabel = $derived(isLoggedIn ? 'Go to Dashboard' : 'Go Home');
</script>

<div class="error-page">
	<h1 class="status-code">{$page.status}</h1>
	<p class="message">{$page.error?.message ?? 'Something went wrong'}</p>
	<div class="actions">
		<a href={homeUrl} class="btn btn-primary">{homeLabel}</a>
		<button class="btn btn-secondary" onclick={() => location.reload()}>Try Again</button>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #fff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		text-align: center;
		padding: 2rem;
	}

	.status-code {
		font-size: 8rem;
		font-weight: 700;
		color: #0066ff;
		line-height: 1;
		margin: 0 0 1rem;
	}

	.message {
		font-size: 1.25rem;
		color: #555;
		margin: 0 0 2.5rem;
		max-width: 400px;
	}

	.actions {
		display: flex;
		gap: 1rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		border: none;
		transition: opacity 0.15s;
	}

	.btn:hover {
		opacity: 0.85;
	}

	.btn-primary {
		background: #0066ff;
		color: #fff;
	}

	.btn-secondary {
		background: #f0f0f0;
		color: #333;
	}
</style>
