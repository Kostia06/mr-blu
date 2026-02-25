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

	const [savingEdit, setSavingEdit] = useState(false);

	async function saveEdit(id: string) {
		if (!editFields.name.trim() || savingEdit) return;
		setSavingEdit(true);

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
			setSavingEdit(false);
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
		<main class="min-h-screen bg-transparent">
			<SettingsPageHeader
				title={t('clients.title')}
				backLabel={t('clients.backToSettings')}
				right={
					<button
						class="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-[12px] border-none rounded-[14px] text-[var(--blu-primary,#0066ff)] cursor-pointer"
						onClick={() => setShowCreate(true)}
						aria-label="Add client"
					>
						<Plus size={20} strokeWidth={2.5} />
					</button>
				}
			/>

			<div class="px-5 pb-[100px] max-w-[600px] w-full mx-auto">
				<div class="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-[14px] mb-4">
					<Search size={16} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
					<input
						type="text"
						value={search}
						onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
						placeholder={t('clients.search')}
						class="flex-1 border-none bg-transparent text-[15px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
					/>
				</div>

				{showCreate && (
					<div class="bg-white/60 backdrop-blur-[12px] border-[1.5px] border-[var(--blu-primary,#0066ff)] rounded-2xl p-4 mb-3">
						<div class="flex items-center justify-between mb-3">
							<span class="text-sm font-bold text-[var(--blu-primary,#0066ff)]">{t('clients.newClient')}</span>
							<div class="flex gap-1">
								<button
									class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0"
									onClick={handleCreate}
									disabled={creating || !createFields.name.trim()}
									aria-label="Save"
								>
									{creating ? (
										<Loader2 size={16} class="animate-spin" />
									) : (
										<Check size={16} class="text-emerald-500" />
									)}
								</button>
								<button class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={cancelCreate} aria-label="Cancel">
									<X size={16} class="text-[#94a3b8]" />
								</button>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<input
								type="text"
								value={createFields.name}
								onInput={(e) =>
									setCreateFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
								}
								placeholder={t('clients.namePlaceholder')}
								class="w-full border-[1.5px] border-[var(--blu-primary,#0066ff)] bg-white/80 rounded-[10px] px-2.5 py-2 text-[15px] font-semibold text-[var(--gray-900,#0f172a)] outline-none font-[inherit] mb-2 box-border"
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleCreate();
									if (e.key === 'Escape') cancelCreate();
								}}
							/>
							<div class="flex items-center gap-2">
								<Mail size={14} class="text-[var(--gray-400)] shrink-0" />
								<input
									type="email"
									value={createFields.email}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
									}
									placeholder="Email"
									class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
								/>
							</div>
							<div class="flex items-center gap-2">
								<Phone size={14} class="text-[var(--gray-400)] shrink-0" />
								<input
									type="tel"
									value={createFields.phone}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
									}
									placeholder="Phone"
									class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
								/>
							</div>
							<div class="flex items-center gap-2">
								<MapPin size={14} class="text-[var(--gray-400)] shrink-0" />
								<input
									type="text"
									value={createFields.address}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, address: (e.target as HTMLInputElement).value }))
									}
									placeholder="Address"
									class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
								/>
							</div>
							<div class="flex items-center gap-2">
								<StickyNote size={14} class="text-[var(--gray-400)] shrink-0 self-start mt-1.5" />
								<textarea
									value={createFields.notes}
									onInput={(e) =>
										setCreateFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
									}
									placeholder={t('clients.notesPlaceholder')}
									class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit] resize-y min-h-9"
									rows={2}
								/>
							</div>
						</div>
					</div>
				)}

				{loading ? (
					<div class="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
						<Loader2 size={32} class="animate-spin text-[var(--brand-blue,#0066ff)]" />
					</div>
				) : filtered.length === 0 ? (
					<div class="flex flex-col items-center justify-center gap-3 px-5 py-[60px] text-center">
						<Users size={40} class="text-[var(--gray-300,#cbd5e1)]" />
						<p class="m-0 text-[15px] font-medium text-[var(--gray-500,#64748b)]">
							{search ? t('clients.noMatch') : t('clients.empty')}
						</p>
						<p class="m-0 text-[13px] text-[var(--gray-400,#94a3b8)] max-w-[280px]">
							{t('clients.emptyHint')}
						</p>
					</div>
				) : (
					<div class="flex flex-col gap-2.5">
						{filtered.map((entry) => (
							<div
								key={entry.id}
								class="bg-white/50 backdrop-blur-[12px] border border-white/50 rounded-2xl p-4 cursor-pointer"
								onClick={() => handleCardClick(entry)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && editingId !== entry.id) handleCardClick(entry);
								}}
							>
								<div class="flex items-center justify-between mb-2.5">
									<div class="flex items-center gap-2.5 min-w-0 flex-1">
										<div class="w-9 h-9 flex items-center justify-center bg-[rgba(0,102,255,0.1)] rounded-full text-[15px] font-bold text-[var(--blu-primary,#0066ff)] shrink-0">
											{entry.name.charAt(0).toUpperCase()}
										</div>
										{editingId === entry.id ? (
											<input
												type="text"
												value={editFields.name}
												onInput={(e) =>
													setEditFields((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
												}
												class="flex-1 border-[1.5px] border-[var(--blu-primary,#0066ff)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[15px] font-semibold text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
												autoFocus
												onClick={(e) => e.stopPropagation()}
												onKeyDown={(e) => {
													if (e.key === 'Enter') saveEdit(entry.id);
													if (e.key === 'Escape') cancelEdit();
												}}
											/>
										) : (
											<span class="text-[15px] font-semibold text-[var(--gray-900,#0f172a)] truncate">{entry.name}</span>
										)}
									</div>
									<div class="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
										{editingId === entry.id ? (
											<>
												<button class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={() => saveEdit(entry.id)} disabled={savingEdit} aria-label="Save">
													{savingEdit ? <Loader2 size={16} class="animate-spin" /> : <Check size={16} class="text-emerald-500" />}
												</button>
												<button class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={cancelEdit} aria-label="Cancel">
													<X size={16} class="text-[#94a3b8]" />
												</button>
											</>
										) : (
											<>
												<button class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0" onClick={() => startEdit(entry)} aria-label="Edit">
													<Pencil size={14} class="text-[#64748b]" />
												</button>
												<button
													class="flex items-center justify-center w-8 h-8 border-none bg-transparent rounded-lg cursor-pointer p-0"
													onClick={() => handleDelete(entry.id)}
													disabled={deletingId === entry.id}
													aria-label="Delete"
												>
													{deletingId === entry.id ? (
														<Loader2 size={14} class="animate-spin" />
													) : (
														<Trash2 size={14} class="text-[#ef4444]" />
													)}
												</button>
												<ChevronRight size={16} class="text-[var(--gray-300,#cbd5e1)]" />
											</>
										)}
									</div>
								</div>

								<div>
									{editingId === entry.id ? (
										<div class="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
											<div class="flex items-center gap-2">
												<Mail size={14} class="text-[var(--gray-400)] shrink-0" />
												<input
													type="email"
													value={editFields.email}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))
													}
													placeholder="Email"
													class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
												/>
											</div>
											<div class="flex items-center gap-2">
												<Phone size={14} class="text-[var(--gray-400)] shrink-0" />
												<input
													type="tel"
													value={editFields.phone}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
													}
													placeholder="Phone"
													class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit]"
												/>
											</div>
											<div class="flex items-center gap-2">
												<StickyNote size={14} class="text-[var(--gray-400)] shrink-0 self-start mt-1.5" />
												<textarea
													value={editFields.notes}
													onInput={(e) =>
														setEditFields((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))
													}
													placeholder={t('clients.notesPlaceholder')}
													class="flex-1 border border-[var(--gray-200,#e2e8f0)] bg-white/80 rounded-[10px] px-2.5 py-1.5 text-[13px] text-[var(--gray-900,#0f172a)] outline-none font-[inherit] resize-y min-h-9"
													rows={2}
												/>
											</div>
										</div>
									) : (
										<div class="flex flex-col gap-1.5">
											{entry.email && (
												<div class="flex items-center gap-2">
													<Mail size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
													<span class="text-[13px] text-[var(--gray-500,#64748b)] truncate">{entry.email}</span>
												</div>
											)}
											{entry.phone && (
												<div class="flex items-center gap-2">
													<Phone size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
													<span class="text-[13px] text-[var(--gray-500,#64748b)] truncate">{entry.phone}</span>
												</div>
											)}
											{entry.address && (
												<div class="flex items-center gap-2">
													<MapPin size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
													<span class="text-[13px] text-[var(--gray-500,#64748b)] truncate">{entry.address}</span>
												</div>
											)}
											{entry.notes && (
												<div class="flex items-center gap-2">
													<StickyNote size={14} class="text-[var(--gray-400,#94a3b8)] shrink-0" />
													<span class="text-[13px] text-[var(--gray-400,#94a3b8)] italic whitespace-pre-wrap break-words">{entry.notes}</span>
												</div>
											)}
											{!entry.email && !entry.phone && !entry.address && !entry.notes && (
												<span class="text-[13px] text-[var(--gray-400,#94a3b8)] italic">{t('clients.noContactInfo')}</span>
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}

				<p class="text-center text-xs text-[var(--gray-400,#94a3b8)] mt-4">
					{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
				</p>
			</div>
		</main>
	);
}
