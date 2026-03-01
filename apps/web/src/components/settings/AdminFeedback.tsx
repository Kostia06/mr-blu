import { useState, useEffect, useCallback } from 'preact/hooks';
import { ChevronLeft, Trash2, MessageCircle, Bug, Lightbulb, Star, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useI18nStore } from '@/lib/i18n';
import { navigateTo } from '@/lib/navigation';
import { getFeedback, deleteFeedback, type FeedbackItem } from '@/lib/api/admin';

const CATEGORY_CONFIG: Record<string, { icon: typeof Bug; color: string; bg: string }> = {
	bug: { icon: Bug, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
	feature: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
	praise: { icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
	general: { icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
	other: { icon: HelpCircle, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

function CategoryBadge({ category }: { category: string }) {
	const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
	const Icon = config.icon;
	return (
		<span class={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${config.bg} ${config.color}`}>
			<Icon size={10} />
			{category}
		</span>
	);
}

export function AdminFeedback() {
	const { t } = useI18nStore();
	const [items, setItems] = useState<FeedbackItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		try {
			const data = await getFeedback();
			setItems(data);
		} catch {
			toast.error(t('admin.feedback.fetchError'));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	async function handleDelete(id: string) {
		setActionLoading(id);
		try {
			await deleteFeedback(id);
			setItems((prev) => prev.filter((i) => i.id !== id));
			toast.success(t('admin.feedback.deleted'));
		} catch {
			toast.error(t('admin.feedback.deleteError'));
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
					{t('admin.feedback.title')}
				</h1>
				<div class="w-10" />
			</header>

			<div class="px-[var(--page-padding-x,20px)] max-w-[var(--page-max-width,600px)] w-full mx-auto flex flex-col gap-4 pb-[100px]">
				{loading ? (
					<div class="flex flex-col gap-3">
						{[1, 2, 3].map((i) => (
							<div key={i} class="h-24 bg-gray-100 rounded-xl animate-pulse" />
						))}
					</div>
				) : items.length === 0 ? (
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<MessageCircle size={40} class="text-gray-300 mb-3" />
						<p class="text-[15px] font-medium text-gray-500">{t('admin.feedback.empty')}</p>
					</div>
				) : (
					<div class="flex flex-col gap-3">
						{items.map((item) => (
							<div
								key={item.id}
								class="bg-white/70 backdrop-blur-[16px] border border-white/60 rounded-[var(--radius-card,20px)] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
							>
								<div class="flex items-start justify-between gap-3 mb-2">
									<div class="flex items-center gap-2 flex-wrap">
										<CategoryBadge category={item.category} />
										<span class="text-[11px] text-gray-400">
											{new Date(item.created_at).toLocaleDateString(undefined, {
												month: 'short',
												day: 'numeric',
												hour: 'numeric',
												minute: '2-digit',
											})}
										</span>
									</div>
									<button
										onClick={() => handleDelete(item.id)}
										disabled={actionLoading === item.id}
										class="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg border border-red-200 shrink-0 disabled:opacity-50"
									>
										<Trash2 size={14} />
									</button>
								</div>

								<p class="text-[14px] text-gray-800 leading-relaxed mb-2 whitespace-pre-wrap">
									{item.comment}
								</p>

								<div class="flex items-center gap-2 text-[11px] text-gray-400">
									<span>{item.profiles?.full_name || item.profiles?.email || 'Unknown'}</span>
									{item.page_context && (
										<>
											<span>·</span>
											<span>{item.page_context}</span>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
