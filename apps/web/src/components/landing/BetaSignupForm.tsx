import { useState, useCallback } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

type FormState = 'idle' | 'loading' | 'success' | 'already' | 'error';

export function BetaSignupForm() {
	const { t } = useI18nStore();
	const [email, setEmail] = useState('');
	const [state, setState] = useState<FormState>('idle');
	const [errorMessage, setErrorMessage] = useState('');

	const handleSubmit = useCallback(
		async (e: Event) => {
			e.preventDefault();
			const trimmed = email.trim();
			if (!trimmed) return;

			setState('loading');
			setErrorMessage('');

			try {
				const response = await fetch('/api/beta/signup', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: trimmed }),
				});

				const data = await response.json();

				if (!response.ok) {
					setState('error');
					setErrorMessage(data.error || t('landing.beta.errorGeneric'));
					return;
				}

				if (data.alreadyConfirmed) {
					setState('already');
					return;
				}

				setState('success');
			} catch {
				setState('error');
				setErrorMessage(t('landing.beta.errorGeneric'));
			}
		},
		[email, t],
	);

	if (state === 'already') {
		return (
			<div className="hero-signup w-full flex flex-col items-center gap-3">
				<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
					<div className="w-2 h-2 rounded-full bg-blue-500" />
					<span className="text-[13px] font-semibold text-blue-700">
						{t('landing.beta.alreadySignedUp')}
					</span>
				</div>
			</div>
		);
	}

	if (state === 'success') {
		return (
			<div className="hero-signup w-full flex flex-col items-center gap-3">
				<div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
					<div className="w-2 h-2 rounded-full bg-emerald-500" />
					<span className="text-[13px] font-semibold text-emerald-700">
						{t('landing.beta.successPending')}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="hero-signup w-full flex flex-col items-center gap-4">
			<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
				<span className="relative flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--blu-primary)] opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--blu-primary)]" />
				</span>
				<span className="text-[12px] font-semibold text-[var(--blu-primary)]">
					{t('landing.beta.badge')}
				</span>
			</div>

			<p className="text-[13px] text-[var(--landing-text-secondary)]">
				{t('landing.beta.spotsLeft')}
			</p>

			<form
				onSubmit={handleSubmit}
				className="w-full max-w-[400px] flex gap-2"
			>
				<input
					type="email"
					required
					value={email}
					onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
					placeholder={t('landing.beta.placeholder')}
					disabled={state === 'loading'}
					className="flex-1 min-w-0 h-12 px-4 text-[15px] bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--blu-primary)] transition-colors disabled:opacity-50"
				/>
				<button
					type="submit"
					disabled={state === 'loading'}
					className="h-12 px-5 text-[14px] font-semibold text-white bg-[var(--blu-primary)] rounded-xl shadow-[0_2px_10px_rgba(0,102,255,0.25)] hover:bg-[#0052cc] transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
				>
					{state === 'loading'
						? '...'
						: t('landing.beta.requestAccess')}
				</button>
			</form>

			{state === 'error' && errorMessage && (
				<p className="text-[13px] text-red-500">{errorMessage}</p>
			)}
		</div>
	);
}
