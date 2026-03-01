import { useState, useEffect, useCallback } from 'preact/hooks';
import { ChevronLeft, Trash2, AlertTriangle, Check, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { useI18nStore } from '@/lib/i18n';
import { navigateTo } from '@/lib/navigation';
import { getErrorLogs, resolveError, deleteError, type ErrorLogItem } from '@/lib/api/admin';

const SEVERITY_STYLES: Record<string, string> = {
	critical: 'bg-red-50 text-red-700 border-red-200',
	error: 'bg-red-50 text-red-600 border-red-200',
	warn: 'bg-amber-50 text-amber-600 border-amber-200',
	info: 'bg-blue-50 text-blue-600 border-blue-200',
};

export function AdminErrors() {
	const { t } = useI18nStore();
	const [items, setItems] = useState<ErrorLogItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);
	const [showResolved, setShowResolved] = useState(false);

	const fetchData = useCallback(async () => {
		try {
			const data = await getErrorLogs();
			setItems(data);
		} catch {
			toast.error(t('admin.errors.fetchError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const filtered = showResolved ? items : items.filter((i) => !i.resolved);
	const unresolvedCount = items.filter((i) => !i.resolved).length;

	async function handleResolve(id: string) {
		setActionLoading(id);
		try {
			await resolveError(id);
			setItems((prev) => prev.map((i) => (i.id === id ? { ...i, resolved: true } : i)));
			toast.success(t('admin.errors.resolved'));
		} catch {
			toast.error(t('admin.errors.resolveError'));
		} finally {
			setActionLoading(null);
		}
	}

	async function handleDelete(id: string) {
		setActionLoading(`del-${id}`);
		try {
			await deleteError(id);
			setItems((prev) => prev.filter((i) => i.id !== id));
			toast.success(t('admin.errors.deleted'));
		} catch {
			toast.error(t('admin.errors.deleteError'));
		} finally {
			setActionLoading(null);
		}
	}

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
					{t('admin.errors.title')}
				</h1>
				<div class="w-10" />
			</header>

			<div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] w-full mx-auto flex flex-col gap-4 pb-[100px]">
				{/* Filter toggle */}
				<div class="flex items-center justify-between">
					<span class="text-[13px] text-gray-500">
						{unresolvedCount} {t('admin.errors.unresolved')}
					</span>
					<button
						class={`text-[13px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
							showResolved
								? 'bg-gray-100 border-gray-200 text-gray-700'
								: 'bg-transparent border-gray-200 text-gray-400'
						}`}
						onClick={() => setShowResolved((p) => !p)}
					>
						{showResolved ? t('admin.errors.hideResolved') : t('admin.errors.showResolved')}
					</button>
				</div>

				{loading ? (
					<div class="flex flex-col gap-3">
						{[1, 2, 3].map((i) => (
							<div key={i} class="h-20 bg-gray-100 rounded-xl animate-pulse" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<Bug size={40} class="text-gray-300 mb-3" />
						<p class="text-[15px] font-medium text-gray-500">{t('admin.errors.empty')}</p>
					</div>
				) : (
					<div class="flex flex-col gap-3">
						{filtered.map((item) => (
							<div
								key={item.id}
								class={`bg-white/70 backdrop-blur-[16px] border border-white/60 rounded-[var(--radius-card,20px)] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${
									item.resolved ? 'opacity-60' : ''
								}`}
							>
								<div class="flex items-start justify-between gap-3 mb-2">
									<div class="flex items-center gap-2 flex-wrap">
										<span
											class={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
												SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.error
											}`}
										>
											<AlertTriangle size={10} />
											{item.severity}
										</span>
										<span class="text-[11px] text-gray-400 font-mono">
											{item.error_type}
										</span>
									</div>
									<div class="flex items-center gap-1 shrink-0">
										{!item.resolved && (
											<button
												onClick={() => handleResolve(item.id)}
												disabled={actionLoading === item.id}
												class="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 disabled:opacity-50"
												title={t('admin.errors.resolve')}
											>
												<Check size={14} strokeWidth={2.5} />
											</button>
										)}
										<button
											onClick={() => handleDelete(item.id)}
											disabled={actionLoading === `del-${item.id}`}
											class="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-200 disabled:opacity-50"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>

								<p class="text-[14px] text-gray-800 font-medium mb-1">{item.message}</p>

								{item.request_path && (
									<p class="text-[12px] text-gray-400 font-mono">
										{item.request_method} {item.request_path}
										{item.status_code ? ` → ${item.status_code}` : ''}
									</p>
								)}

								<span class="text-[11px] text-gray-400 mt-1 block">
									{new Date(item.created_at).toLocaleDateString(undefined, {
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
									})}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
