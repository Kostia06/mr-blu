import { useState, useEffect, useCallback } from 'preact/hooks';
import {
	Search,
	Trash2,
	Loader2,
	Wrench,
	Plus,
	ChevronRight,
	Check,
	X,
} from 'lucide-react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { navigateTo } from '@/lib/navigation';
import { listServices, deleteService, createService } from '@/lib/api/services';
import type { Service } from '@/lib/api/services';

export function ServiceBook() {
	const [entries, setEntries] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [createName, setCreateName] = useState('');
	const [creating, setCreating] = useState(false);

	const fetchEntries = useCallback(async () => {
		setLoading(true);
		try {
			const result = await listServices();
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

	const filtered = entries.filter((e) =>
		e.name.toLowerCase().includes(search.toLowerCase())
	);

	async function handleDelete(id: string) {
		setDeletingId(id);
		try {
			await deleteService(id);
			setEntries((prev) => prev.filter((e) => e.id !== id));
		} catch {
			// silently fail
		} finally {
			setDeletingId(null);
		}
	}

	async function handleCreate() {
		if (!createName.trim()) return;
		setCreating(true);
		try {
			const service = await createService({ name: createName.trim() });
			if (service) {
				setEntries((prev) => [service, ...prev]);
			}
			setCreateName('');
			setShowCreate(false);
		} catch {
			// silently fail
		} finally {
			setCreating(false);
		}
	}

	function cancelCreate() {
		setShowCreate(false);
		setCreateName('');
	}

	function handleCardClick(entry: Service) {
		navigateTo(`/dashboard/settings/service-book/${entry.id}`);
	}

	function countMaterialOptions(items: Service['items']): number {
		return items.reduce((sum, item) => sum + item.materialOptions.length, 0);
	}

	return (
		<main style={styles.page}>
			<SettingsPageHeader
				title="Service Book"
				backLabel="Back to settings"
				right={
					<button
						style={styles.addBtn}
						onClick={() => setShowCreate(true)}
						aria-label="Add service"
					>
						<Plus size={20} strokeWidth={2.5} />
					</button>
				}
			/>

			<div style={styles.content}>
				<div style={styles.searchWrap}>
					<Search size={16} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
					<input
						type="text"
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
						placeholder="Search services..."
						style={styles.searchInput}
					/>
				</div>

				{showCreate && (
					<div style={styles.createCard}>
						<div style={styles.createHeader}>
							<span style={styles.createTitle}>New Service</span>
							<div style={{ display: 'flex', gap: 4 }}>
								<button
									style={styles.iconBtn}
									onClick={handleCreate}
									disabled={creating || !createName.trim()}
									aria-label="Save"
								>
									{creating ? (
										<Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
									) : (
										<Check size={16} style={{ color: '#10b981' }} />
									)}
								</button>
								<button style={styles.iconBtn} onClick={cancelCreate} aria-label="Cancel">
									<X size={16} style={{ color: '#94a3b8' }} />
								</button>
							</div>
						</div>
						<input
							type="text"
							value={createName}
							onInput={(e) => setCreateName((e.target as HTMLInputElement).value)}
							placeholder="Service name (e.g. Build Fence)"
							style={styles.createNameInput}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleCreate();
								if (e.key === 'Escape') cancelCreate();
							}}
						/>
					</div>
				)}

				{loading ? (
					<div style={styles.emptyState}>
						<Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
					</div>
				) : filtered.length === 0 ? (
					<div style={styles.emptyState}>
						<Wrench size={40} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
						<p style={styles.emptyText}>
							{search ? 'No matching services' : 'No services yet'}
						</p>
						<p style={styles.emptyHint}>
							Create reusable job templates with line items and material options
						</p>
					</div>
				) : (
					<div style={styles.list}>
						{filtered.map((entry) => {
							const itemCount = entry.items.length;
							const optionCount = countMaterialOptions(entry.items);
							return (
								<div
									key={entry.id}
									style={styles.card}
									onClick={() => handleCardClick(entry)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleCardClick(entry);
									}}
								>
									<div style={styles.cardHeader}>
										<div style={styles.serviceInfo}>
											<div style={styles.avatar}>
												<Wrench size={16} />
											</div>
											<span style={styles.serviceName}>{entry.name}</span>
										</div>
										<div style={styles.cardActions} onClick={(e) => e.stopPropagation()}>
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
											<ChevronRight size={16} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
										</div>
									</div>

									<div style={styles.cardBody}>
										<div style={styles.badgeRow}>
											<span style={styles.badge}>
												{itemCount} {itemCount === 1 ? 'item' : 'items'}
											</span>
											{optionCount > 0 && (
												<span style={styles.badgeGreen}>
													{optionCount} {optionCount === 1 ? 'option' : 'options'}
												</span>
											)}
										</div>
										{entry.description && (
											<p style={styles.descText}>{entry.description}</p>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}

				<p style={styles.countText}>
					{filtered.length} {filtered.length === 1 ? 'service' : 'services'}
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
	addBtn: {
		width: 40,
		height: 40,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'rgba(255,255,255,0.5)',
		backdropFilter: 'blur(12px)',
		border: 'none',
		borderRadius: 14,
		color: 'var(--blu-primary, #0066ff)',
		cursor: 'pointer',
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
	createCard: {
		background: 'rgba(255,255,255,0.6)',
		backdropFilter: 'blur(12px)',
		border: '1.5px solid var(--blu-primary, #0066ff)',
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
	},
	createHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	createTitle: {
		fontSize: 14,
		fontWeight: 700,
		color: 'var(--blu-primary, #0066ff)',
	},
	createNameInput: {
		width: '100%',
		border: '1.5px solid var(--blu-primary, #0066ff)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '8px 10px',
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		boxSizing: 'border-box',
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
		cursor: 'pointer',
	},
	cardHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	serviceInfo: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		minWidth: 0,
		flex: 1,
	},
	avatar: {
		width: 36,
		height: 36,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'rgba(0, 102, 255, 0.1)',
		borderRadius: '50%',
		color: 'var(--blu-primary, #0066ff)',
		flexShrink: 0,
	},
	serviceName: {
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
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
	badgeRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	badge: {
		fontSize: 11,
		fontWeight: 500,
		color: 'var(--brand-blue, #0066ff)',
		background: 'rgba(0, 102, 255, 0.08)',
		padding: '2px 8px',
		borderRadius: 20,
		whiteSpace: 'nowrap',
	},
	badgeGreen: {
		fontSize: 11,
		fontWeight: 500,
		color: '#10b981',
		background: 'rgba(16, 185, 129, 0.08)',
		padding: '2px 8px',
		borderRadius: 20,
		whiteSpace: 'nowrap',
	},
	descText: {
		margin: '8px 0 0',
		fontSize: 13,
		color: 'var(--gray-400, #94a3b8)',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	countText: {
		textAlign: 'center',
		fontSize: 12,
		color: 'var(--gray-400, #94a3b8)',
		marginTop: 16,
	},
};
