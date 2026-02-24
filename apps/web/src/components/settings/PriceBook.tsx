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
	Plus,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import {
	listPricing,
	deletePricing,
	updatePricing,
	addPricing,
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
	const [showAddForm, setShowAddForm] = useState(false);
	const [addName, setAddName] = useState('');
	const [addUnit, setAddUnit] = useState('unit');
	const [addRate, setAddRate] = useState('');
	const [adding, setAdding] = useState(false);

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

	async function handleAdd() {
		const rate = parseFloat(addRate);
		if (!addName.trim() || isNaN(rate) || rate <= 0) return;

		setAdding(true);
		try {
			const entry = await addPricing({
				name: addName.trim(),
				unit: addUnit,
				unitPrice: rate,
			});
			if (entry) {
				setEntries((prev) => [entry, ...prev]);
				setAddName('');
				setAddUnit('unit');
				setAddRate('');
				setShowAddForm(false);
			}
		} catch {
			// silently fail
		} finally {
			setAdding(false);
		}
	}

	return (
		<main className="min-h-screen bg-transparent">
			<SettingsPageHeader
				title={t('settings.priceBook') || 'Price Book'}
				backLabel="Back to settings"
			/>

			<div className="px-5 pb-[100px] max-w-[600px] w-full mx-auto">
				{/* Search */}
				<div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-[14px] mb-4">
					<Search size={16} className="text-[var(--gray-400,#94a3b8)] shrink-0" />
					<input
						type="text"
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
						placeholder={t('settings.priceBookSearch') || 'Search materials...'}
						className="flex-1 border-none bg-transparent text-[15px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
					/>
				</div>

				{/* Add button / form */}
				{showAddForm ? (
					<div className="bg-white/60 backdrop-blur-[12px] border-[1.5px] border-[var(--blu-primary,#0066ff)] rounded-2xl p-4 mb-4">
						<div className="flex items-center justify-between mb-3">
							<span className="text-sm font-bold text-[var(--blu-primary,#0066ff)]">{t('settings.priceBookAdd') || 'Add Item'}</span>
							<div className="flex gap-1">
								<button
									className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0"
									onClick={handleAdd}
									disabled={adding || !addName.trim() || !addRate}
									aria-label="Save"
								>
									{adding ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<Check size={16} className="text-emerald-500" />
									)}
								</button>
								<button
									className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0"
									onClick={() => setShowAddForm(false)}
									aria-label="Cancel"
								>
									<X size={16} className="text-[#94a3b8]" />
								</button>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<input
								type="text"
								value={addName}
								onInput={(e) => setAddName((e.target as HTMLInputElement).value)}
								placeholder={t('settings.priceBookName') || 'Material name'}
								className="w-full border-[1.5px] border-[var(--blu-primary,#0066ff)] bg-white/80 rounded-[10px] px-2.5 py-2 text-[15px] font-semibold text-[var(--gray-900,#0f172a)] outline-none font-[inherit] box-border"
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleAdd();
									if (e.key === 'Escape') setShowAddForm(false);
								}}
							/>
							<div className="flex items-center gap-2">
								<BookOpen size={14} className="text-[var(--gray-400)] shrink-0" />
								<select
									value={addUnit}
									onChange={(e) => setAddUnit((e.target as HTMLSelectElement).value)}
									className="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
								>
									{Object.entries(MEASUREMENT_LABELS).map(([key, label]) => (
										<option key={key} value={key}>{label}</option>
									))}
								</select>
							</div>
							<div className="flex items-center gap-2">
								<DollarSign size={14} className="text-[var(--gray-400)] shrink-0" />
								<input
									type="number"
									value={addRate}
									onInput={(e) => setAddRate((e.target as HTMLInputElement).value)}
									placeholder="0.00"
									className="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
									step="0.01"
									min="0"
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleAdd();
										if (e.key === 'Escape') setShowAddForm(false);
									}}
								/>
							</div>
						</div>
					</div>
				) : (
					<button
						className="flex items-center justify-center gap-1.5 w-full px-4 py-3 text-sm font-semibold font-[inherit] text-[var(--brand-blue,#0066ff)] bg-[rgba(0,102,255,0.06)] border-[1.5px] border-dashed border-[rgba(0,102,255,0.25)] rounded-[14px] cursor-pointer mb-4"
						onClick={() => setShowAddForm(true)}
					>
						<Plus size={16} />
						<span>{t('settings.priceBookAdd') || 'Add Item'}</span>
					</button>
				)}

				{loading ? (
					<div className="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
						<Loader2 size={32} className="animate-spin text-[var(--brand-blue,#0066ff)]" />
					</div>
				) : filtered.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
						<BookOpen size={40} className="text-[var(--gray-300,#cbd5e1)]" />
						<p className="m-0 text-[15px] font-medium text-[var(--gray-500,#64748b)]">
							{search
								? t('settings.priceBookNoResults') || 'No matching materials'
								: t('settings.priceBookEmpty') || 'No saved prices yet'}
						</p>
						<p className="m-0 text-[13px] text-[var(--gray-400,#94a3b8)] max-w-[280px]">
							{t('settings.priceBookHint') || 'Prices are saved automatically when you approve documents'}
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2.5">
						{filtered.map((entry) => (
							<div key={entry.id} className="bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-2xl p-4">
								<div className="flex items-center justify-between mb-2.5">
									<div className="flex items-center gap-2 min-w-0 flex-1">
										<DollarSign size={16} className="text-[var(--brand-blue,#0066ff)]" />
										<span className="text-[15px] font-semibold text-[var(--gray-900,#0f172a)] capitalize whitespace-nowrap overflow-hidden text-ellipsis">
											{entry.material}
										</span>
										<span className="text-[11px] font-medium text-[var(--brand-blue,#0066ff)] bg-[rgba(0,102,255,0.08)] px-2 py-0.5 rounded-[20px] whitespace-nowrap shrink-0">
											{MEASUREMENT_LABELS[entry.measurement_type] || entry.measurement_type}
										</span>
									</div>
									<div className="flex items-center gap-1 shrink-0">
										{editingId === entry.id ? (
											<>
												<button className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={() => saveEdit(entry.id)} aria-label="Save">
													<Check size={16} className="text-[#10b981]" />
												</button>
												<button className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={cancelEdit} aria-label="Cancel">
													<X size={16} className="text-[#94a3b8]" />
												</button>
											</>
										) : (
											<>
												<button className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={() => startEdit(entry)} aria-label="Edit">
													<Pencil size={14} className="text-[#64748b]" />
												</button>
												<button
													className="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0"
													onClick={() => handleDelete(entry.id)}
													disabled={deletingId === entry.id}
													aria-label="Delete"
												>
													{deletingId === entry.id ? (
														<Loader2 size={14} className="animate-spin" />
													) : (
														<Trash2 size={14} className="text-[#ef4444]" />
													)}
												</button>
											</>
										)}
									</div>
								</div>

								<div>
									{editingId === entry.id ? (
										<div className="flex items-center gap-2.5 mb-2">
											<span className="text-[13px] text-[var(--gray-500,#64748b)] whitespace-nowrap">
												Rate per {MEASUREMENT_LABELS[entry.measurement_type] || 'unit'}:
											</span>
											<div className="flex items-center gap-1 flex-1 bg-white/80 border-[1.5px] border-[var(--brand-blue,#0066ff)] rounded-[10px] px-2.5 py-1.5">
												<span className="text-[15px] font-semibold text-[var(--gray-500,#64748b)]">$</span>
												<input
													type="number"
													value={editRate}
													onInput={(e) => setEditRate((e.target as HTMLInputElement).value)}
													className="flex-1 border-none bg-transparent text-[15px] font-semibold text-[var(--gray-900,#0f172a)] outline-none font-[inherit] w-full"
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
										<div className="flex items-baseline gap-1 mb-2">
											<span className="text-[22px] font-bold text-[var(--gray-900,#0f172a)] tracking-[-0.02em]">
												{formatRate(entry.rate_per_unit)}
											</span>
											<span className="text-[13px] text-[var(--gray-500,#64748b)]">
												/ {MEASUREMENT_LABELS[entry.measurement_type] || 'unit'}
											</span>
										</div>
									)}

									<div className="flex items-center gap-2">
										<span className="text-xs text-[var(--gray-400,#94a3b8)]">
											Used {entry.usage_count}x
										</span>
										<span className="w-[3px] h-[3px] rounded-full bg-[var(--gray-300,#cbd5e1)]" />
										<span className="text-xs text-[var(--gray-400,#94a3b8)]">
											{formatDate(entry.last_used_at)}
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				)}

				<p className="text-center text-xs text-[var(--gray-400,#94a3b8)] mt-4">
					{filtered.length} {filtered.length === 1 ? 'material' : 'materials'}
				</p>
			</div>
		</main>
	);
}
