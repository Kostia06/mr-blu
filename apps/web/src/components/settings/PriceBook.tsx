import { useState, useEffect, useCallback } from 'preact/hooks';
import {
	Search,
	Trash2,
	Pencil,
	Check,
	X,
	Loader2,
	BookOpen,
	DollarSign,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import {
	listPricing,
	deletePricing,
	updatePricing,
} from '@/lib/api/pricing';

interface PricingEntry {
	id: string;
	material: string;
	measurement_type: string;
	rate_per_unit: number;
	base_quantity: number;
	base_rate: number;
	usage_count: number;
	last_used_at: string;
}

const MEASUREMENT_LABELS: Record<string, string> = {
	sqft: 'sq ft',
	linear_ft: 'linear ft',
	hour: 'hour',
	job: 'job',
	unit: 'unit',
};

function formatRate(rate: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	}).format(rate);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

export function PriceBook() {
	const { t } = useI18nStore();

	const [entries, setEntries] = useState<PricingEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editRate, setEditRate] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchEntries = useCallback(async () => {
		setLoading(true);
		try {
			const result = await listPricing();
			if (result.items) setEntries(result.items);
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchEntries();
	}, [fetchEntries]);

	const filtered = entries.filter(
		(e) =>
			e.material.toLowerCase().includes(search.toLowerCase()) ||
			e.measurement_type.toLowerCase().includes(search.toLowerCase())
	);

	async function handleDelete(id: string) {
		setDeletingId(id);
		try {
			await deletePricing(id);
			setEntries((prev) => prev.filter((e) => e.id !== id));
		} catch {
			// silently fail
		} finally {
			setDeletingId(null);
		}
	}

	function startEdit(entry: PricingEntry) {
		setEditingId(entry.id);
		setEditRate(String(entry.rate_per_unit));
	}

	function cancelEdit() {
		setEditingId(null);
		setEditRate('');
	}

	async function saveEdit(id: string) {
		const rate = parseFloat(editRate);
		if (isNaN(rate) || rate <= 0) return;

		try {
			await updatePricing(id, { rate_per_unit: rate });
			setEntries((prev) =>
				prev.map((e) => (e.id === id ? { ...e, rate_per_unit: rate } : e))
			);
		} catch {
			// silently fail
		} finally {
			setEditingId(null);
			setEditRate('');
		}
	}

	return (
		<main style={styles.page}>
			<SettingsPageHeader
				title={t('settings.priceBook') || 'Price Book'}
				backLabel="Back to settings"
			/>

			<div style={styles.content}>
				{/* Search */}
				<div style={styles.searchWrap}>
					<Search size={16} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
					<input
						type="text"
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
						placeholder={t('settings.priceBookSearch') || 'Search materials...'}
						style={styles.searchInput}
					/>
				</div>

				{loading ? (
					<div style={styles.emptyState}>
						<Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
					</div>
				) : filtered.length === 0 ? (
					<div style={styles.emptyState}>
						<BookOpen size={40} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
						<p style={styles.emptyText}>
							{search
								? t('settings.priceBookNoResults') || 'No matching materials'
								: t('settings.priceBookEmpty') || 'No saved prices yet'}
						</p>
						<p style={styles.emptyHint}>
							{t('settings.priceBookHint') || 'Prices are saved automatically when you approve documents'}
						</p>
					</div>
				) : (
					<div style={styles.list}>
						{filtered.map((entry) => (
							<div key={entry.id} style={styles.card}>
								<div style={styles.cardHeader}>
									<div style={styles.materialInfo}>
										<DollarSign size={16} style={{ color: 'var(--brand-blue, #0066ff)' }} />
										<span style={styles.materialName}>{entry.material}</span>
										<span style={styles.measureBadge}>
											{MEASUREMENT_LABELS[entry.measurement_type] || entry.measurement_type}
										</span>
									</div>
									<div style={styles.cardActions}>
										{editingId === entry.id ? (
											<>
												<button style={styles.iconBtn} onClick={() => saveEdit(entry.id)} aria-label="Save">
													<Check size={16} style={{ color: '#10b981' }} />
												</button>
												<button style={styles.iconBtn} onClick={cancelEdit} aria-label="Cancel">
													<X size={16} style={{ color: '#94a3b8' }} />
												</button>
											</>
										) : (
											<>
												<button style={styles.iconBtn} onClick={() => startEdit(entry)} aria-label="Edit">
													<Pencil size={14} style={{ color: '#64748b' }} />
												</button>
												<button
													style={styles.iconBtn}
													onClick={() => handleDelete(entry.id)}
													disabled={deletingId === entry.id}
													aria-label="Delete"
												>
													{deletingId === entry.id ? (
														<Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
													) : (
														<Trash2 size={14} style={{ color: '#ef4444' }} />
													)}
												</button>
											</>
										)}
									</div>
								</div>

								<div style={styles.cardBody}>
									{editingId === entry.id ? (
										<div style={styles.editRow}>
											<span style={styles.rateLabel}>Rate per {MEASUREMENT_LABELS[entry.measurement_type] || 'unit'}:</span>
											<div style={styles.editInputWrap}>
												<span style={styles.dollarPrefix}>$</span>
												<input
													type="number"
													value={editRate}
													onInput={(e) => setEditRate((e.target as HTMLInputElement).value)}
													style={styles.editInput}
													step="0.01"
													min="0"
													autoFocus
													onKeyDown={(e) => {
														if (e.key === 'Enter') saveEdit(entry.id);
														if (e.key === 'Escape') cancelEdit();
													}}
												/>
											</div>
										</div>
									) : (
										<div style={styles.rateRow}>
											<span style={styles.rateValue}>
												{formatRate(entry.rate_per_unit)}
											</span>
											<span style={styles.rateUnit}>
												/ {MEASUREMENT_LABELS[entry.measurement_type] || 'unit'}
											</span>
										</div>
									)}

									<div style={styles.metaRow}>
										<span style={styles.metaItem}>
											Used {entry.usage_count}x
										</span>
										<span style={styles.metaDot} />
										<span style={styles.metaItem}>
											{formatDate(entry.last_used_at)}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				<p style={styles.countText}>
					{filtered.length} {filtered.length === 1 ? 'material' : 'materials'}
				</p>
			</div>

			<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
		</main>
	);
}

const styles: Record<string, Record<string, string | number>> = {
	page: {
		minHeight: '100vh',
		background: 'transparent',
	},
	content: {
		padding: '0 20px 100px',
		maxWidth: 600,
		width: '100%',
		margin: '0 auto',
	},
	searchWrap: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		padding: '10px 14px',
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255,255,255,0.5)',
		borderRadius: 14,
		marginBottom: 16,
	},
	searchInput: {
		flex: 1,
		border: 'none',
		background: 'transparent',
		fontSize: 15,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
	},
	emptyState: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: '60px 20px',
		textAlign: 'center',
	},
	emptyText: {
		margin: 0,
		fontSize: 15,
		fontWeight: 500,
		color: 'var(--gray-500, #64748b)',
	},
	emptyHint: {
		margin: 0,
		fontSize: 13,
		color: 'var(--gray-400, #94a3b8)',
		maxWidth: 280,
	},
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
	},
	card: {
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255,255,255,0.5)',
		borderRadius: 16,
		padding: 16,
	},
	cardHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	materialInfo: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		minWidth: 0,
		flex: 1,
	},
	materialName: {
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		textTransform: 'capitalize',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	measureBadge: {
		fontSize: 11,
		fontWeight: 500,
		color: 'var(--brand-blue, #0066ff)',
		background: 'rgba(0, 102, 255, 0.08)',
		padding: '2px 8px',
		borderRadius: 20,
		whiteSpace: 'nowrap',
		flexShrink: 0,
	},
	cardActions: {
		display: 'flex',
		alignItems: 'center',
		gap: 4,
		flexShrink: 0,
	},
	iconBtn: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		border: 'none',
		background: 'transparent',
		borderRadius: 8,
		cursor: 'pointer',
		padding: 0,
	},
	cardBody: {},
	rateRow: {
		display: 'flex',
		alignItems: 'baseline',
		gap: 4,
		marginBottom: 8,
	},
	rateValue: {
		fontSize: 22,
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		letterSpacing: '-0.02em',
	},
	rateUnit: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
	},
	editRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		marginBottom: 8,
	},
	rateLabel: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
		whiteSpace: 'nowrap',
	},
	editInputWrap: {
		display: 'flex',
		alignItems: 'center',
		gap: 4,
		flex: 1,
		background: 'rgba(255,255,255,0.8)',
		border: '1.5px solid var(--brand-blue, #0066ff)',
		borderRadius: 10,
		padding: '6px 10px',
	},
	dollarPrefix: {
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-500, #64748b)',
	},
	editInput: {
		flex: 1,
		border: 'none',
		background: 'transparent',
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		width: '100%',
	},
	metaRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	metaItem: {
		fontSize: 12,
		color: 'var(--gray-400, #94a3b8)',
	},
	metaDot: {
		width: 3,
		height: 3,
		borderRadius: '50%',
		background: 'var(--gray-300, #cbd5e1)',
	},
	countText: {
		textAlign: 'center',
		fontSize: 12,
		color: 'var(--gray-400, #94a3b8)',
		marginTop: 16,
	},
};
