<script lang="ts">
	import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
	import FileText from 'lucide-svelte/icons/file-text';
	import Settings from 'lucide-svelte/icons/settings';
	import LogOut from 'lucide-svelte/icons/log-out';
	import Logo from '$lib/components/Logo.svelte';

	interface Props {
		currentPath: string;
		onSignOut?: () => void;
	}

	let { currentPath, onSignOut }: Props = $props();

	const navItems = [
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/dashboard/documents', icon: FileText, label: 'Documents' },
		{ href: '/dashboard/settings', icon: Settings, label: 'Settings' }
	];

	const isActive = (href: string): boolean => {
		if (href === '/dashboard') {
			return currentPath === '/dashboard';
		}
		return currentPath.startsWith(href);
	};
</script>

<aside
	class="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0"
>
	<!-- Logo Section -->
	<div class="flex items-center h-16 px-6 border-b border-gray-100">
		<a href="/dashboard" class="flex items-center">
			<Logo size="md" />
		</a>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 px-3 py-4 space-y-1">
		{#each navItems as item (item.href)}
			{@const active = isActive(item.href)}
			<a
				href={item.href}
				class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
					{active ? 'bg-primary-50 text-primary-600' : 'text-navy-600 hover:bg-gray-50 hover:text-navy-800'}"
				aria-current={active ? 'page' : undefined}
			>
				<item.icon size={20} strokeWidth={active ? 2 : 1.5} class="flex-shrink-0" />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<!-- Sign Out Button -->
	<div class="px-3 py-4 border-t border-gray-100">
		<button
			type="button"
			onclick={onSignOut}
			class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-navy-600 hover:bg-gray-50 hover:text-red-600 transition-all duration-200"
		>
			<LogOut size={20} strokeWidth={1.5} class="flex-shrink-0" />
			<span>Sign Out</span>
		</button>
	</div>
</aside>
