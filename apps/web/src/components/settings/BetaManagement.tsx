import { useState, useEffect, useCallback } from 'preact/hooks';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, UserPlus, Check, Trash2, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useI18nStore } from '@/lib/i18n';
import { navigateTo } from '@/lib/navigation';
import {
	getBetaSignups,
	confirmBetaUser,
	addBetaUser,
	removeBetaUser,
	type BetaSignup,
} from '@/lib/api/admin';

interface BetaManagementProps {
	user: User | null;
}

function StatusBadge({ status }: { status: 'pending' | 'confirmed' }) {
	const { t } = useI18nStore();
	const isPending = status === 'pending';

	return (
		<span
			class={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
				isPending
					? 'bg-amber-50 text-amber-600 border border-amber-200'
					: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
			}`}
		>
			{isPending ? <Clock size={10} /> : <UserCheck size={10} />}
			{isPending ? t('admin.beta.pending') : t('admin.beta.confirmed')}
		</span>
	);
}

export function BetaManagement({ user }: BetaManagementProps) {
	const { t } = useI18nStore();
	const [signups, setSignups] = useState<BetaSignup[]>([]);
	const [loading, setLoading] = useState(true);
	const [newEmail, setNewEmail] = useState('');
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchSignups = useCallback(async () => {
		try {
			const data = await getBetaSignups();
			setSignups(data);
		} catch {
			toast.error(t('admin.beta.fetchError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchSignups();
	}, [fetchSignups]);

	async function handleConfirm(email: string) {
		setActionLoading(email);
		try {
			await confirmBetaUser(email);
			toast.success(t('admin.beta.confirmSuccess'));
			await fetchSignups();
		} catch {
			toast.error(t('admin.beta.confirmError'));
		} finally {
			setActionLoading(null);
		}
	}

	async function handleRemove(email: string) {
		setActionLoading(`remove-${email}`);
		try {
			await removeBetaUser(email);
			toast.success(t('admin.beta.removeSuccess'));
			setSignups((prev) => prev.filter((s) => s.email !== email));
		} catch {
			toast.error(t('admin.beta.removeError'));
		} finally {
			setActionLoading(null);
		}
	}

	async function handleAdd(e: Event) {
		e.preventDefault();
		const email = newEmail.trim().toLowerCase();
		if (!email) return;

		setActionLoading('add');
		try {
			await addBetaUser(email);
			toast.success(t('admin.beta.addSuccess'));
			setNewEmail('');
			await fetchSignups();
		} catch {
			toast.error(t('admin.beta.addError'));
		} finally {
			setActionLoading(null);
		}
	}

	const pendingCount = signups.filter((s) => s.status === 'pending').length;
	const confirmedCount = signups.filter((s) => s.status === 'confirmed').length;

	return (
		<main class="min-h-screen bg-transparent">
			<header class="sticky top-0 z-[var(--z-sticky,40)] flex items-center justify-between px-[var(--page-padding-x,20px)] pb-[var(--space-3,12px)] pt-[calc(var(--space-3,12px)+var(--safe-area-top,0px))] bg-transparent max-w-[var(--page-max-width,600px)] mx-auto w-full">
				<button
					class="w-10 h-10 flex items-center justify-center bg-[var(--glass-white-50,rgba(255,255,255,0.5))] backdrop-blur-[12px] border-none rounded-[var(--radius-button,14px)] text-[var(--gray-600,#475569)] cursor-pointer"
					onClick={() => navigateTo('/dashboard/settings')}
					aria-label="Back"
				>
					<ChevronLeft size={22} strokeWidth={2} />
				</button>
				<h1 class="font-[var(--font-display,system-ui)] text-lg font-bold text-[var(--gray-900,#0f172a)] m-0 tracking-[-0.02em]">
					{t('admin.beta.title')}
				</h1>
				<div class="w-10" />
			</header>

			<div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] w-full mx-auto flex flex-col gap-5 pb-[100px]">
				{/* Stats */}
				<div class="flex gap-3">
					<div class="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
						<p class="text-2xl font-bold text-amber-600">{pendingCount}</p>
						<p class="text-[12px] text-amber-500 font-medium">{t('admin.beta.pending')}</p>
					</div>
					<div class="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
						<p class="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
						<p class="text-[12px] text-emerald-500 font-medium">{t('admin.beta.confirmed')}</p>
					</div>
				</div>

				{/* Add email form */}
				<form onSubmit={handleAdd} class="flex gap-2">
					<input
						type="email"
						required
						value={newEmail}
						onInput={(e) => setNewEmail((e.target as HTMLInputElement).value)}
						placeholder={t('admin.beta.addPlaceholder')}
						class="flex-1 min-w-0 h-12 px-4 text-[15px] bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--blu-primary,#0066ff)] transition-colors"
					/>
					<button
						type="submit"
						disabled={actionLoading === 'add'}
						class="h-12 px-4 flex items-center gap-1.5 text-[14px] font-semibold text-white bg-[var(--blu-primary,#0066ff)] rounded-xl disabled:opacity-50 whitespace-nowrap"
					>
						<UserPlus size={16} />
						{t('admin.beta.add')}
					</button>
				</form>

				{/* List */}
				{loading ? (
					<div class="flex flex-col gap-3">
						{[1, 2, 3].map((i) => (
							<div key={i} class="h-16 bg-gray-100 rounded-xl animate-pulse" />
						))}
					</div>
				) : signups.length === 0 ? (
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<UserPlus size={40} class="text-gray-300 mb-3" />
						<p class="text-[15px] font-medium text-gray-500">{t('admin.beta.empty')}</p>
					</div>
				) : (
					<div class="flex flex-col bg-white/70 backdrop-blur-[16px] border border-white/60 rounded-[var(--radius-card,20px)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
						{signups.map((signup) => (
							<div
								key={signup.id}
								class="flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0"
							>
								<div class="flex-1 min-w-0">
									<p class="text-[15px] font-medium text-gray-900 truncate">
										{signup.email}
									</p>
									<div class="flex items-center gap-2 mt-1">
										<StatusBadge status={signup.status} />
										<span class="text-[11px] text-gray-400">
											{new Date(signup.added_at).toLocaleDateString()}
										</span>
									</div>
								</div>

								<div class="flex items-center gap-1.5 shrink-0">
									{signup.status === 'pending' && (
										<button
											onClick={() => handleConfirm(signup.email)}
											disabled={actionLoading === signup.email}
											class="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 disabled:opacity-50"
											title={t('admin.beta.confirm')}
										>
											<Check size={16} strokeWidth={2.5} />
										</button>
									)}
									<button
										onClick={() => handleRemove(signup.email)}
										disabled={actionLoading === `remove-${signup.email}`}
										class="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-200 disabled:opacity-50"
										title={t('admin.beta.remove')}
									>
										<Trash2 size={14} strokeWidth={2} />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
