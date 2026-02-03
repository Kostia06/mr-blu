<script lang="ts">
	import type { User } from '@supabase/supabase-js';
	import Bell from 'lucide-svelte/icons/bell';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Avatar from '$lib/components/ui/Avatar.svelte';

	import type { Snippet } from 'svelte';

	interface Props {
		user: User | null;
		onSignOut?: () => void;
		left?: Snippet;
	}

	let { user, onSignOut, left }: Props = $props();

	const displayName = $derived(
		user?.user_metadata?.full_name ||
			user?.user_metadata?.first_name ||
			user?.email?.split('@')[0] ||
			'User'
	);

	const avatarUrl = $derived(user?.user_metadata?.avatar_url || null);
</script>

<header class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
	<div class="flex items-center justify-between h-16 px-4 md:px-6">
		<!-- Left side - can be used for page title or breadcrumbs -->
		<div class="flex items-center">
			{#if left}
				{@render left()}
			{/if}
		</div>

		<!-- Right side - User info and actions -->
		<div class="flex items-center gap-3 md:gap-4">
			<!-- Notifications -->
			<button
				type="button"
				class="relative p-2 rounded-full text-navy-600 hover:bg-gray-100 hover:text-navy-800 transition-colors"
				aria-label="Notifications"
			>
				<Bell size={20} strokeWidth={1.5} />
				<!-- Notification badge (optional) -->
				<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full hidden"></span>
			</button>

			<!-- User Profile -->
			<div class="flex items-center gap-3">
				<!-- User info - hidden on mobile -->
				<div class="hidden sm:flex flex-col items-end">
					<span class="text-sm font-medium text-navy-800 truncate max-w-[150px]">
						{displayName}
					</span>
					{#if user?.email}
						<span class="text-xs text-gray-500 truncate max-w-[150px]">
							{user.email}
						</span>
					{/if}
				</div>

				<!-- Avatar -->
				<Avatar src={avatarUrl} name={displayName} size="sm" />

				<!-- Sign out button - visible on larger screens -->
				<button
					type="button"
					onclick={onSignOut}
					class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-navy-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
					aria-label="Sign out"
				>
					<LogOut size={16} strokeWidth={1.5} />
					<span class="hidden lg:inline">Sign Out</span>
				</button>
			</div>
		</div>
	</div>
</header>
