import { useState, useEffect, useCallback } from 'preact/hooks';
import {
	Loader2,
	Pencil,
	Check,
	X,
	Plus,
	Trash2,
	Wrench,
	FileQuestion,
} from 'lucide-react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { getService, updateService } from '@/lib/api/services';
import type { Service, ServiceItem, MaterialOption } from '@/lib/api/services';

const UNIT_OPTIONS = [
	{ value: 'sqft', label: 'sq ft' },
	{ value: 'linear_ft', label: 'linear ft' },
	{ value: 'hour', label: 'hour' },
	{ value: 'job', label: 'job' },
	{ value: 'unit', label: 'unit' },
	{ value: 'service', label: 'service' },
];

const UNIT_LABELS: Record<string, string> = {
	sqft: 'sq ft',
	linear_ft: 'linear ft',
	hour: 'hour',
	job: 'job',
	unit: 'unit',
	service: 'service',
};

function generateId(): string {
	return Math.random().toString(36).substring(2, 11);
}

function formatRate(rate: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	}).format(rate);
}

export function ServiceDetailView({ serviceId }: { serviceId: string }) {
	const [service, setService] = useState<Service | null>(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editName, setEditName] = useState('');
	const [editDescription, setEditDescription] = useState('');
	const [editItems, setEditItems] = useState<ServiceItem[]>([]);

	const loadService = useCallback(async () => {
		setLoading(true);
		try {
			const data = await getService(serviceId);
			if (data) setService(data);
		} catch {
			// silently fail
		} finally {
			setLoading(false);
		}
	}, [serviceId]);

	useEffect(() => {
		loadService();
	}, [loadService]);

	function startEdit() {
		if (!service) return;
		setEditName(service.name);
		setEditDescription(service.description ?? '');
		setEditItems(JSON.parse(JSON.stringify(service.items)));
		setEditing(true);
	}

	function cancelEdit() {
		setEditing(false);
	}

	async function saveEdit() {
		if (!service || !editName.trim()) return;
		setSaving(true);

		const cleanedItems = editItems
			.filter((item) => item.description.trim())
			.map((item) => ({
				...item,
				description: item.description.trim(),
				materialOptions: item.materialOptions.filter((opt) => opt.name.trim()),
			}));

		try {
			const success = await updateService(service.id, {
				name: editName.trim(),
				description: editDescription.trim() || undefined,
				items: cleanedItems,
			});
			if (success) {
				setService({
					...service,
					name: editName.trim(),
					description: editDescription.trim() || null,
					items: cleanedItems,
					updated_at: new Date().toISOString(),
				});
			}
		} catch {
			// silently fail
		} finally {
			setSaving(false);
			setEditing(false);
		}
	}

	function addItem() {
		setEditItems((prev) => [
			...prev,
			{
				id: generateId(),
				description: '',
				unit: 'service',
				defaultRate: 0,
				materialOptions: [],
			},
		]);
	}

	function removeItem(itemId: string) {
		setEditItems((prev) => prev.filter((i) => i.id !== itemId));
	}

	function updateItem(itemId: string, field: keyof ServiceItem, value: string | number) {
		setEditItems((prev) =>
			prev.map((item) =>
				item.id === itemId ? { ...item, [field]: value } : item
			)
		);
	}

	function addMaterialOption(itemId: string) {
		setEditItems((prev) =>
			prev.map((item) =>
				item.id === itemId
					? { ...item, materialOptions: [...item.materialOptions, { name: '', rate: 0 }] }
					: item
			)
		);
	}

	function removeMaterialOption(itemId: string, optionIndex: number) {
		setEditItems((prev) =>
			prev.map((item) =>
				item.id === itemId
					? { ...item, materialOptions: item.materialOptions.filter((_, i) => i !== optionIndex) }
					: item
			)
		);
	}

	function updateMaterialOption(
		itemId: string,
		optionIndex: number,
		field: keyof MaterialOption,
		value: string | number
	) {
		setEditItems((prev) =>
			prev.map((item) => {
				if (item.id !== itemId) return item;
				const updatedOptions = item.materialOptions.map((opt, i) =>
					i === optionIndex ? { ...opt, [field]: value } : opt
				);
				const defaultRate =
					field === 'rate'
						? (updatedOptions[0]?.rate ?? item.defaultRate)
						: item.defaultRate;
				return { ...item, materialOptions: updatedOptions, defaultRate };
			})
		);
	}

	if (loading) {
		return (
			<main style={styles.page}>
				<SettingsPageHeader
					title="Service"
					backHref="/dashboard/settings/service-book"
					backLabel="Back to services"
				/>
				<div style={styles.centered}>
					<Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
				</div>
				<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
			</main>
		);
	}

	if (!service) {
		return (
			<main style={styles.page}>
				<SettingsPageHeader
					title="Service"
					backHref="/dashboard/settings/service-book"
					backLabel="Back to services"
				/>
				<div style={styles.centered}>
					<FileQuestion size={40} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
					<p style={styles.emptyText}>Service not found</p>
				</div>
			</main>
		);
	}

	return (
		<main style={styles.page}>
			<SettingsPageHeader
				title={service.name}
				backHref="/dashboard/settings/service-book"
				backLabel="Back to services"
				right={
					editing ? (
						<div style={{ display: 'flex', gap: 4 }}>
							<button style={styles.headerBtn} onClick={saveEdit} disabled={saving} aria-label="Save">
								{saving ? (
									<Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
								) : (
									<Check size={18} style={{ color: '#10b981' }} />
								)}
							</button>
							<button style={styles.headerBtn} onClick={cancelEdit} aria-label="Cancel">
								<X size={18} style={{ color: '#94a3b8' }} />
							</button>
						</div>
					) : (
						<button style={styles.headerBtn} onClick={startEdit} aria-label="Edit">
							<Pencil size={16} style={{ color: '#64748b' }} />
						</button>
					)
				}
			/>

			<div style={styles.content}>
				{editing ? renderEditMode() : renderViewMode()}
			</div>

			<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
		</main>
	);

	function renderViewMode() {
		return (
			<>
				<div style={styles.card}>
					<div style={styles.infoHeader}>
						<div style={styles.avatar}>
							<Wrench size={18} />
						</div>
						<span style={styles.serviceName}>{service!.name}</span>
					</div>
					{service!.description && (
						<p style={styles.description}>{service!.description}</p>
					)}
				</div>

				<h2 style={styles.sectionTitle}>
					Line Items ({service!.items.length})
				</h2>

				{service!.items.length === 0 ? (
					<div style={styles.emptyItems}>
						<p style={styles.emptyText}>No line items yet</p>
						<p style={styles.emptyHint}>Tap the pencil icon to add items</p>
					</div>
				) : (
					<div style={styles.itemList}>
						{service!.items.map((item) => (
							<div key={item.id} style={styles.itemCard}>
								<div style={styles.itemHeader}>
									<span style={styles.itemDesc}>{item.description}</span>
									<span style={styles.itemRate}>
										{formatRate(item.defaultRate)}/{UNIT_LABELS[item.unit] || item.unit}
									</span>
								</div>
								{item.materialOptions.length > 0 && (
									<div style={styles.optionsList}>
										{item.materialOptions.map((opt, i) => (
											<div key={i} style={styles.optionRow}>
												<span style={styles.optionName}>{opt.name}</span>
												<span style={styles.optionRate}>
													{formatRate(opt.rate)}/{UNIT_LABELS[item.unit] || item.unit}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</>
		);
	}

	function renderEditMode() {
		return (
			<>
				<div style={styles.card}>
					<label style={styles.fieldLabel}>Service Name</label>
					<input
						type="text"
						value={editName}
						onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
						style={styles.fieldInput}
						autoFocus
					/>

					<label style={{ ...styles.fieldLabel, marginTop: 12 }}>Description</label>
					<textarea
						value={editDescription}
						onInput={(e) => setEditDescription((e.target as HTMLTextAreaElement).value)}
						style={styles.textarea}
						placeholder="Optional description"
						rows={2}
					/>
				</div>

				<div style={styles.sectionHeader}>
					<h2 style={styles.sectionTitle}>Line Items ({editItems.length})</h2>
					<button style={styles.addItemBtn} onClick={addItem}>
						<Plus size={14} />
						<span>Add Item</span>
					</button>
				</div>

				<div style={styles.itemList}>
					{editItems.map((item) => (
						<div key={item.id} style={styles.editItemCard}>
							<div style={styles.editItemHeader}>
								<span style={styles.editItemLabel}>Item</span>
								<button
									style={styles.iconBtn}
									onClick={() => removeItem(item.id)}
									aria-label="Remove item"
								>
									<Trash2 size={14} style={{ color: '#ef4444' }} />
								</button>
							</div>

							<input
								type="text"
								value={item.description}
								onInput={(e) =>
									updateItem(item.id, 'description', (e.target as HTMLInputElement).value)
								}
								placeholder="Description (e.g. Fencing Material)"
								style={styles.fieldInput}
							/>

							<div style={styles.rowTwo}>
								<div style={styles.selectWrap}>
									<select
										value={item.unit}
										onChange={(e) =>
											updateItem(item.id, 'unit', (e.target as HTMLSelectElement).value)
										}
										style={styles.select}
									>
										{UNIT_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>
								<div style={styles.rateInputWrap}>
									<span style={styles.dollarPrefix}>$</span>
									<input
										type="number"
										value={item.defaultRate}
										onInput={(e) =>
											updateItem(
												item.id,
												'defaultRate',
												parseFloat((e.target as HTMLInputElement).value) || 0
											)
										}
										style={styles.rateInput}
										step="0.01"
										min="0"
										placeholder="Rate"
									/>
								</div>
							</div>

							<div style={styles.optionsSection}>
								<div style={styles.optionsHeader}>
									<span style={styles.optionsLabel}>
										Material Options ({item.materialOptions.length})
									</span>
									<button
										style={styles.addOptionBtn}
										onClick={() => addMaterialOption(item.id)}
									>
										<Plus size={12} />
										<span>Add</span>
									</button>
								</div>
								{item.materialOptions.map((opt, optIdx) => (
									<div key={optIdx} style={styles.optionEditRow}>
										<input
											type="text"
											value={opt.name}
											onInput={(e) =>
												updateMaterialOption(
													item.id,
													optIdx,
													'name',
													(e.target as HTMLInputElement).value
												)
											}
											placeholder="Name (e.g. Cedar)"
											style={styles.optionNameInput}
										/>
										<div style={styles.optionRateWrap}>
											<span style={styles.dollarPrefix}>$</span>
											<input
												type="number"
												value={opt.rate}
												onInput={(e) =>
													updateMaterialOption(
														item.id,
														optIdx,
														'rate',
														parseFloat((e.target as HTMLInputElement).value) || 0
													)
												}
												style={styles.optionRateInput}
												step="0.01"
												min="0"
											/>
										</div>
										<button
											style={styles.iconBtnSm}
											onClick={() => removeMaterialOption(item.id, optIdx)}
											aria-label="Remove option"
										>
											<X size={12} style={{ color: '#ef4444' }} />
										</button>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</>
		);
	}
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
	centered: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		padding: '60px 20px',
		textAlign: 'center',
	},
	card: {
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255,255,255,0.5)',
		borderRadius: 16,
		padding: 16,
	},
	infoHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		marginBottom: 4,
	},
	avatar: {
		width: 44,
		height: 44,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'rgba(0, 102, 255, 0.1)',
		borderRadius: '50%',
		color: 'var(--blu-primary, #0066ff)',
		flexShrink: 0,
	},
	serviceName: {
		fontSize: 17,
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
	},
	description: {
		margin: '8px 0 0',
		fontSize: 14,
		color: 'var(--gray-500, #64748b)',
		lineHeight: 1.4,
	},
	headerBtn: {
		width: 40,
		height: 40,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: 'none',
		borderRadius: 14,
		cursor: 'pointer',
	},
	sectionHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		margin: '24px 0 12px',
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: 700,
		color: 'var(--gray-900, #0f172a)',
		margin: '24px 0 12px',
		letterSpacing: '-0.01em',
	},
	emptyItems: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: 8,
		padding: '40px 20px',
		textAlign: 'center',
	},
	emptyText: {
		margin: 0,
		fontSize: 14,
		fontWeight: 500,
		color: 'var(--gray-400, #94a3b8)',
	},
	emptyHint: {
		margin: 0,
		fontSize: 13,
		color: 'var(--gray-400, #94a3b8)',
	},
	itemList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
	},
	itemCard: {
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255,255,255,0.5)',
		borderRadius: 14,
		padding: 14,
	},
	itemHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	itemDesc: {
		fontSize: 14,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
	},
	itemRate: {
		fontSize: 14,
		fontWeight: 600,
		color: 'var(--brand-blue, #0066ff)',
		whiteSpace: 'nowrap',
	},
	optionsList: {
		marginTop: 8,
		paddingTop: 8,
		borderTop: '1px solid rgba(0,0,0,0.04)',
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
	},
	optionRow: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '2px 0',
	},
	optionName: {
		fontSize: 13,
		color: 'var(--gray-600, #475569)',
	},
	optionRate: {
		fontSize: 13,
		fontWeight: 500,
		color: 'var(--gray-500, #64748b)',
	},
	fieldLabel: {
		fontSize: 12,
		fontWeight: 600,
		color: 'var(--gray-500, #64748b)',
		display: 'block',
		marginBottom: 4,
	},
	fieldInput: {
		width: '100%',
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '8px 10px',
		fontSize: 15,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		boxSizing: 'border-box',
	},
	textarea: {
		width: '100%',
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '8px 10px',
		fontSize: 14,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		resize: 'vertical',
		minHeight: 48,
		boxSizing: 'border-box',
	},
	editItemCard: {
		background: 'rgba(255,255,255,0.6)',
		backdropFilter: 'blur(12px)',
		border: '1px solid rgba(255,255,255,0.5)',
		borderRadius: 14,
		padding: 14,
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
	},
	editItemHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	editItemLabel: {
		fontSize: 12,
		fontWeight: 600,
		color: 'var(--gray-500, #64748b)',
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
	iconBtnSm: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: 28,
		height: 28,
		border: 'none',
		background: 'transparent',
		borderRadius: 6,
		cursor: 'pointer',
		padding: 0,
		flexShrink: 0,
	},
	rowTwo: {
		display: 'flex',
		gap: 8,
	},
	selectWrap: {
		flex: 1,
	},
	select: {
		width: '100%',
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '8px 10px',
		fontSize: 13,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		appearance: 'auto',
	},
	rateInputWrap: {
		display: 'flex',
		alignItems: 'center',
		gap: 4,
		flex: 1,
		background: 'rgba(255,255,255,0.8)',
		border: '1px solid var(--gray-200, #e2e8f0)',
		borderRadius: 10,
		padding: '0 10px',
	},
	dollarPrefix: {
		fontSize: 14,
		fontWeight: 600,
		color: 'var(--gray-500, #64748b)',
	},
	rateInput: {
		flex: 1,
		border: 'none',
		background: 'transparent',
		fontSize: 14,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		padding: '8px 0',
		width: '100%',
	},
	optionsSection: {
		marginTop: 4,
		paddingTop: 8,
		borderTop: '1px solid rgba(0,0,0,0.04)',
	},
	optionsHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	optionsLabel: {
		fontSize: 12,
		fontWeight: 600,
		color: 'var(--gray-500, #64748b)',
	},
	addItemBtn: {
		display: 'flex',
		alignItems: 'center',
		gap: 4,
		padding: '6px 12px',
		background: 'rgba(0, 102, 255, 0.08)',
		border: 'none',
		borderRadius: 8,
		color: 'var(--blu-primary, #0066ff)',
		fontSize: 13,
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	},
	addOptionBtn: {
		display: 'flex',
		alignItems: 'center',
		gap: 3,
		padding: '4px 8px',
		background: 'rgba(16, 185, 129, 0.08)',
		border: 'none',
		borderRadius: 6,
		color: '#10b981',
		fontSize: 12,
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	},
	optionEditRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
		marginBottom: 4,
	},
	optionNameInput: {
		flex: 1,
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 8,
		padding: '6px 8px',
		fontSize: 13,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
	},
	optionRateWrap: {
		display: 'flex',
		alignItems: 'center',
		gap: 3,
		background: 'rgba(255,255,255,0.8)',
		border: '1px solid var(--gray-200, #e2e8f0)',
		borderRadius: 8,
		padding: '0 8px',
		width: 90,
		flexShrink: 0,
	},
	optionRateInput: {
		flex: 1,
		border: 'none',
		background: 'transparent',
		fontSize: 13,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		padding: '6px 0',
		width: '100%',
	},
};
