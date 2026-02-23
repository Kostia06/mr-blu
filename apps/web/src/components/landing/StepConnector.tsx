interface StepConnectorProps {
	animated?: boolean;
	delay?: number;
}

const styles = {
	connector: {
		display: 'none',
		width: 80,
		height: 20,
		flexShrink: 0,
	},
	svg: {
		width: '100%',
		height: '100%',
	},
};

const CONNECTOR_CSS = `
@media (min-width: 900px) {
	.step-connector {
		display: block !important;
	}
}

.connector-line {
	stroke-dashoffset: 100;
	opacity: 0.5;
}

.step-connector.animated .connector-line {
	animation: draw-connector-line 1s ease-out forwards;
	animation-delay: var(--delay);
}

@keyframes draw-connector-line {
	from {
		stroke-dashoffset: 100;
		opacity: 0.3;
	}
	to {
		stroke-dashoffset: 0;
		opacity: 0.7;
	}
}

@media (prefers-reduced-motion: reduce) {
	.connector-line {
		stroke-dashoffset: 0;
		opacity: 0.5;
	}
	.step-connector.animated .connector-line {
		animation: none;
	}
}
`;

export function StepConnector({ animated = false, delay = 0 }: StepConnectorProps) {
	const className = `step-connector ${animated ? 'animated' : ''}`;

	return (
		<>
			<style>{CONNECTOR_CSS}</style>
			<div
				className={className}
				style={{ ...styles.connector, '--delay': `${delay}s` } as any}
			>
				<svg viewBox="0 0 80 20" fill="none" preserveAspectRatio="none" style={styles.svg}>
					<path
						d="M0 10 L80 10"
						stroke="url(#connector-gradient)"
						strokeWidth="2"
						strokeDasharray="6 4"
						className="connector-line"
					/>
					<defs>
						<linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="var(--blu-primary, #0066FF)" />
							<stop offset="100%" stopColor="var(--blu-accent-cyan, #0EA5E9)" />
						</linearGradient>
					</defs>
				</svg>
			</div>
		</>
	);
}
