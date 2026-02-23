import { useState, useEffect, useCallback } from 'preact/hooks';
import {
	Search,
	Trash2,
	Pencil,
	Check,
	X,
	Loader2,
	Users,
	Mail,
	Phone,
	MapPin,
	Plus,
	ChevronRight,
	StickyNote,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { navigateTo } from '@/lib/navigation';
import { listClients, deleteClient, updateClient, createClient } from '@/lib/api/clients';

interface ClientEntry {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	address: string | null;
	notes: string | null;
}

interface EditFields {
	name: string;
	email: string;
	phone: string;
	address: string;
	notes: string;
}

const EMPTY_FIELDS: EditFields = { name: '', email: '', phone: '', address: '', notes: '' };

export function ClientBook() {
	const { t } = useI18nStore();

	const [entries, setEntries] = useState<ClientEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editFields, setEditFields] = useState<EditFields>(EMPTY_FIELDS);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [showCreate, setShowCreate] = useState(false);
	const [createFields, setCreateFields] = useState<EditFields>(EMPTY_FIELDS);
	const [creating, setCreating] = useState(false);

	const fetchEntries = useCallback(async () => {
		setLoading(true);
		try {
			const result = await listClients();
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
			e.name.toLowerCase().includes(search.toLowerCase()) ||
			(e.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
			(e.phone?.includes(search) ?? false)
	);

	async function handleDelete(id: string) {
		setDeletingId(id);
		try {
			await deleteClient(id);
			setEntries((prev) => prev.filter((e) => e.id !== id));
		} catch {
			// silently fail
		} finally {
			setDeletingId(null);
		}
	}

	function startEdit(entry: ClientEntry) {
		setEditingId(entry.id);
		setEditFields({
			name: entry.name,
			email: entry.email ?? '',
			phone: entry.phone ?? '',
			address: entry.address ?? '',
			notes: entry.notes ?? '',
		});
	}

	function cancelEdit() {
		setEditingId(null);
		setEditFields(EMPTY_FIELDS);
	}

	async function saveEdit(id: string) {
		if (!editFields.name.trim()) return;

		try {
			await updateClient(id, {
				name: editFields.name.trim(),
				email: editFields.email.trim() || undefined,
				phone: editFields.phone.trim() || undefined,
				notes: editFields.notes.trim() || undefined,
			});
			setEntries((prev) =>
				prev.map((e) =>
					e.id === id
						? {
								...e,
								name: editFields.name.trim(),
								email: editFields.email.trim() || null,
								phone: editFields.phone.trim() || null,
								address: editFields.address.trim() || null,
								notes: editFields.notes.trim() || null,
						  }
						: e
				)
			);
		} catch {
			// silently fail
		} finally {
			cancelEdit();
		}
	}

	async function handleCreate() {
		if (!createFields.name.trim()) return;
		setCreating(true);
		try {
			const client = await createClient({
				name: createFields.name.trim(),
				email: createFields.email.trim() || undefined,
				phone: createFields.phone.trim() || undefined,
				address: createFields.address.trim() || undefined,
				notes: createFields.notes.trim() || undefined,
			});
			if (client) {
				setEntries((prev) => [client, ...prev]);
			}
			setCreateFields(EMPTY_FIELDS);
			setShowCreate(false);
		} catch {
			// silently fail
		} finally {
			setCreating(false);
		}
	}

	function cancelCreate() {
		setShowCreate(false);
		setCreateFields(EMPTY_FIELDS);
	}

	function handleCardClick(entry: ClientEntry) {
		if (editingId === entry.id) return;
		navigateTo(`/dashboard/settings/clients/${entry.id}`);
	}

	return (
		<main style={styles.page}>
			<SettingsPageHeader
				title={t('clients.title')}
				backLabel={t('clients.backToSettings')}
				right={
					<button
						style={styles.addBtn}
						onClick={() => setShowCreate(true)}
						aria-label="Add client"
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
						placeholder={t('clients.search')}
						style={styles.searchInput}
					/>
				</div>

				{/* Create form */}
				{showCreate && (
					<div style={styles.createCard}>
						<div style={styles.createHeader}>
							<span style={styles.createTitle}>{t('clients.newClient')}</span>
							<div style={{ display: 'flex', gap: 4 }}>
								<button
									style={styles.iconBtn}
									onClick={handleCreate}
									disabled={creating || !createFields.name.trim()}
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
						<div style={styles.editFields}>
							<input
								type="text"
								value={createFields.name}
								onInput={(e) =>
									setCreateFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
								}
								placeholder={t('clients.namePlaceholder')}
								style={styles.createNameInput}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleCreate();
									if (e.key === 'Escape') cancelCreate();
								}}
							/>
							<div style={styles.editFieldRow}>
								<Mail size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
								<input
									type="email"
									value={createFields.email}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
									}
									placeholder="Email"
									style={styles.editFieldInput}
								/>
							</div>
							<div style={styles.editFieldRow}>
								<Phone size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
								<input
									type="tel"
									value={createFields.phone}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
									}
									placeholder="Phone"
									style={styles.editFieldInput}
								/>
							</div>
							<div style={styles.editFieldRow}>
								<MapPin size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
								<input
									type="text"
									value={createFields.address}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, address: (e.target as HTMLInputElement).value }))
									}
									placeholder="Address"
									style={styles.editFieldInput}
								/>
							</div>
							<div style={styles.editFieldRow}>
								<StickyNote size={14} style={{ color: 'var(--gray-400)', flexShrink: '0', alignSelf: 'flex-start', marginTop: 6 }} />
								<textarea
									value={createFields.notes}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
									}
									placeholder={t('clients.notesPlaceholder')}
									style={styles.notesInput}
									rows={2}
								/>
							</div>
						</div>
					</div>
				)}

				{loading ? (
					<div style={styles.emptyState}>
						<Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-blue, #0066ff)' }} />
					</div>
				) : filtered.length === 0 ? (
					<div style={styles.emptyState}>
						<Users size={40} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
						<p style={styles.emptyText}>
							{search ? t('clients.noMatch') : t('clients.empty')}
						</p>
						<p style={styles.emptyHint}>
							{t('clients.emptyHint')}
						</p>
					</div>
				) : (
					<div style={styles.list}>
						{filtered.map((entry) => (
							<div
								key={entry.id}
								style={styles.card}
								onClick={() => handleCardClick(entry)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && editingId !== entry.id) handleCardClick(entry);
								}}
							>
								<div style={styles.cardHeader}>
									<div style={styles.clientInfo}>
										<div style={styles.avatar}>
											{entry.name.charAt(0).toUpperCase()}
										</div>
										{editingId === entry.id ? (
											<input
												type="text"
												value={editFields.name}
												onInput={(e) =>
													setEditFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
												}
												style={styles.editNameInput}
												autoFocus
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => {
													if (e.key === 'Enter') saveEdit(entry.id);
													if (e.key === 'Escape') cancelEdit();
												}}
											/>
										) : (
											<span style={styles.clientName}>{entry.name}</span>
										)}
									</div>
									<div style={styles.cardActions} onClick={(e) => e.stopPropagation()}>
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
												<ChevronRight size={16} style={{ color: 'var(--gray-300, #cbd5e1)' }} />
											</>
										)}
									</div>
								</div>

								<div style={styles.cardBody}>
									{editingId === entry.id ? (
										<div style={styles.editFields} onClick={(e) => e.stopPropagation()}>
											<div style={styles.editFieldRow}>
												<Mail size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
												<input
													type="email"
													value={editFields.email}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
													}
													placeholder="Email"
													style={styles.editFieldInput}
												/>
											</div>
											<div style={styles.editFieldRow}>
												<Phone size={14} style={{ color: 'var(--gray-400)', flexShrink: '0' }} />
												<input
													type="tel"
													value={editFields.phone}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
													}
													placeholder="Phone"
													style={styles.editFieldInput}
												/>
											</div>
											<div style={styles.editFieldRow}>
												<StickyNote size={14} style={{ color: 'var(--gray-400)', flexShrink: '0', alignSelf: 'flex-start', marginTop: 6 }} />
												<textarea
													value={editFields.notes}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
													}
													placeholder={t('clients.notesPlaceholder')}
													style={styles.notesInput}
													rows={2}
												/>
											</div>
										</div>
									) : (
										<div style={styles.detailRows}>
											{entry.email && (
												<div style={styles.detailRow}>
													<Mail size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
													<span style={styles.detailText}>{entry.email}</span>
												</div>
											)}
											{entry.phone && (
												<div style={styles.detailRow}>
													<Phone size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
													<span style={styles.detailText}>{entry.phone}</span>
												</div>
											)}
											{entry.address && (
												<div style={styles.detailRow}>
													<MapPin size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
													<span style={styles.detailText}>{entry.address}</span>
												</div>
											)}
											{entry.notes && (
												<div style={styles.detailRow}>
													<StickyNote size={14} style={{ color: 'var(--gray-400, #94a3b8)', flexShrink: '0' }} />
													<span style={styles.notesText}>{entry.notes}</span>
												</div>
											)}
											{!entry.email && !entry.phone && !entry.address && !entry.notes && (
												<span style={styles.noDetails}>{t('clients.noContactInfo')}</span>
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				<p style={styles.countText}>
					{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
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
		marginBottom: 8,
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
	clientInfo: {
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
		fontSize: 15,
		fontWeight: 700,
		color: 'var(--blu-primary, #0066ff)',
		flexShrink: 0,
	},
	clientName: {
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	editNameInput: {
		flex: 1,
		border: '1.5px solid var(--blu-primary, #0066ff)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '6px 10px',
		fontSize: 15,
		fontWeight: 600,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
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
	detailRows: {
		display: 'flex',
		flexDirection: 'column',
		gap: 6,
	},
	detailRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	detailText: {
		fontSize: 13,
		color: 'var(--gray-500, #64748b)',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	noDetails: {
		fontSize: 13,
		color: 'var(--gray-400, #94a3b8)',
		fontStyle: 'italic',
	},
	editFields: {
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
	},
	editFieldRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
	},
	editFieldInput: {
		flex: 1,
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '6px 10px',
		fontSize: 13,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
	},
	notesInput: {
		flex: 1,
		border: '1px solid var(--gray-200, #e2e8f0)',
		background: 'rgba(255,255,255,0.8)',
		borderRadius: 10,
		padding: '6px 10px',
		fontSize: 13,
		color: 'var(--gray-900, #0f172a)',
		outline: 'none',
		fontFamily: 'inherit',
		resize: 'vertical',
		minHeight: 36,
	},
	notesText: {
		fontSize: 13,
		color: 'var(--gray-400, #94a3b8)',
		fontStyle: 'italic',
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
	},
	countText: {
		textAlign: 'center',
		fontSize: 12,
		color: 'var(--gray-400, #94a3b8)',
		marginTop: 16,
	},
};
