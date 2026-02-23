import { useState, useEffect, useMemo } from 'preact/hooks';
import { useI18nStore } from '@/lib/i18n';

interface Word {
	text: string;
	highlight?: boolean;
}

interface HeroHeadlineProps {
	words?: Word[];
}

const styles = {
	container: {
		textAlign: 'center' as const,
		position: 'relative' as const,
		transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
		transitionDelay: '0.1s',
	},
	headline: {
		fontFamily: 'var(--font-display)',
		fontSize: 'clamp(2.5rem, 8vw, 5rem)',
		fontWeight: 700,
		lineHeight: 1.1,
		letterSpacing: '-0.03em',
		color: 'var(--gray-900, #0f172a)',
		margin: '0 0 24px 0',
	},
	word: {
		display: 'inline-block',
	},
	highlight: {
		display: 'inline-block',
		background: 'linear-gradient(135deg, #0066ff 0%, #0ea5e9 50%, #6366f1 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	},
	subheadline: {
		fontFamily: 'var(--font-body)',
		fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
		fontWeight: 400,
		lineHeight: 1.6,
		color: 'var(--gray-600, #475569)',
		maxWidth: 540,
		margin: '0 auto',
	},
};

export function HeroHeadline({ words: wordsProp }: HeroHeadlineProps) {
	const { t } = useI18nStore();
	const [visible, setVisible] = useState(false);

	const words = useMemo(
		() =>
			wordsProp ?? [
				{ text: t('landing.hero.word1') },
				{ text: t('landing.hero.word2'), highlight: true },
				{ text: t('landing.hero.word3') },
			],
		[wordsProp, t]
	);

	const subheadline = useMemo(() => t('landing.hero.subheadline'), [t]);

	useEffect(() => {
		requestAnimationFrame(() => {
			setVisible(true);
		});
	}, []);

	const containerStyle = {
		...styles.container,
		opacity: visible ? 1 : 0,
		transform: visible ? 'translateY(0)' : 'translateY(16px)',
	};

	return (
		<div style={containerStyle}>
			<h1 style={styles.headline}>
				{words.map((word, wordIndex) => (
					<>
						<span
							key={word.text}
							style={word.highlight ? styles.highlight : styles.word}
						>
							{word.text}
						</span>
						{wordIndex < words.length - 1 && (
							<span style={{ display: 'inline' }}>&nbsp;</span>
						)}
					</>
				))}
			</h1>
			<p style={styles.subheadline}>{subheadline}</p>
		</div>
	);
}
