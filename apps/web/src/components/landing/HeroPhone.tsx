import { useState, useMemo, useRef } from 'preact/hooks';
import {
	CheckCircle2,
	Mic,
	FileText,
	Settings,
	Keyboard,
	ChevronRight,
	User,
	Bell,
	Moon,
	Shield,
} from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import './HeroPhone.css';

type TabType = 'documents' | 'record' | 'settings';

function getActiveIndex(tab: TabType): number {
	if (tab === 'documents') return 0;
	if (tab === 'record') return 1;
	return 2;
}

export function HeroPhone() {
	const { t } = useI18nStore();
	const phoneRef = useRef<HTMLDivElement>(null);
	const [activeTab, setActiveTab] = useState<TabType>('record');

	const activeIndex = getActiveIndex(activeTab);

	const documents = useMemo(
		() => [
			{
				type: t('landing.phone.invoice'),
				typeKey: 'invoice',
				client: 'ABC Corp',
				amount: '$1,250',
				date: t('landing.phone.today'),
			},
			{
				type: t('landing.phone.estimate'),
				typeKey: 'estimate',
				client: 'Smith Home',
				amount: '$3,400',
				date: t('landing.phone.yesterday'),
			},
			{
				type: t('landing.phone.receipt'),
				typeKey: 'receipt',
				client: 'Johnson LLC',
				amount: '$890',
				date: t('landing.phone.daysAgo').replace('{n}', '2'),
			},
		],
		[t]
	);

	const settingsItems = useMemo(
		() => [
			{ Icon: User, label: t('landing.phone.profile'), value: 'Mike R.' },
			{ Icon: Bell, label: t('landing.phone.notifications'), value: t('landing.phone.on') },
			{ Icon: Moon, label: t('landing.phone.darkMode'), value: t('landing.phone.off') },
			{ Icon: Shield, label: t('landing.phone.security'), value: '' },
		],
		[t]
	);

	const currentTime = useMemo(() => {
		const now = new Date();
		return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
	}, []);

	return (
		<div className="hero-phone-container" ref={phoneRef}>
			<div className="phone-3d-wrapper">
				{/* iPhone Frame */}
				<div className="iphone-frame">
					<div className="frame-highlight frame-highlight-left" />
					<div className="frame-highlight frame-highlight-right" />
					<div className="frame-highlight frame-highlight-top" />

					<div className="side-button volume-up" />
					<div className="side-button volume-down" />
					<div className="side-button silent-switch" />
					<div className="side-button power-button" />

					<div className="screen-bezel">
						<div className="glass-reflection" />

						{/* Dynamic Island */}
						<div className="dynamic-island">
							<div className="island-camera" />
							<div className="island-sensor" />
						</div>

						{/* Status Bar */}
						<div className="status-bar">
							<span className="status-time">{currentTime}</span>
							<div className="status-right">
								<div className="signal-bars">
									<div className="bar bar-1" />
									<div className="bar bar-2" />
									<div className="bar bar-3" />
									<div className="bar bar-4" />
								</div>
								<div className="wifi-icon">
									<svg viewBox="0 0 16 12" fill="currentColor">
										<path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-3.5-2.3a5 5 0 017 0l-.9.9a3.7 3.7 0 00-5.2 0l-.9-.9zm-2.1-2.1a7.5 7.5 0 0111.2 0l-.9.9a6.2 6.2 0 00-9.4 0l-.9-.9z" />
									</svg>
								</div>
								<div className="battery">
									<div className="battery-body">
										<div className="battery-level" />
									</div>
									<div className="battery-cap" />
								</div>
							</div>
						</div>

						{/* Phone screen content */}
						<div className="phone-screen">
							<div className="screen-blobs">
								<div className="screen-blob blob-1" />
								<div className="screen-blob blob-2" />
								<div className="screen-blob blob-3" />
							</div>

							<div className="content-area">
								{activeTab === 'record' && (
									<div className="record-section">
										<div className="record-btn-wrapper">
											<div className="glow-ring" />
											<div className="orb">
												<div className="gradient-pulse" />
												<div className="cloud-layer layer-1" />
												<div className="cloud-layer layer-2" />
												<div className="cloud-layer layer-3" />
												<div className="ambient-light" />
											</div>
										</div>
										<p className="record-hint">{t('landing.phone.tapToRecord')}</p>
										<button className="type-option">
											<Keyboard size={12} strokeWidth={2} />
											<span>{t('landing.phone.orTypeInstead')}</span>
										</button>
									</div>
								)}

								{activeTab === 'documents' && (
									<div className="documents-section">
										<div className="section-header">
											<h3 className="section-title">{t('landing.phone.recent')}</h3>
											<button className="see-all">{t('landing.phone.seeAll')}</button>
										</div>
										<div className="documents-list">
											{documents.map((doc) => (
												<div className="document-item" key={doc.typeKey}>
													<div className={`doc-icon ${doc.typeKey}`}>
														<FileText size={14} strokeWidth={2} />
													</div>
													<div className="doc-info">
														<span className="doc-type">{doc.type}</span>
														<span className="doc-client">{doc.client}</span>
													</div>
													<div className="doc-meta">
														<span className="doc-amount">{doc.amount}</span>
														<span className="doc-date">{doc.date}</span>
													</div>
													<ChevronRight size={14} className="doc-arrow" />
												</div>
											))}
										</div>
									</div>
								)}

								{activeTab === 'settings' && (
									<div className="settings-section">
										<div className="settings-list">
											{settingsItems.map((item) => (
												<div className="settings-item" key={item.label}>
													<div className="settings-icon">
														<item.Icon size={16} strokeWidth={2} />
													</div>
													<span className="settings-label">{item.label}</span>
													{item.value && (
														<span className="settings-value">{item.value}</span>
													)}
													<ChevronRight size={14} className="settings-arrow" />
												</div>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Bottom Nav */}
							<div className="bottom-nav-wrapper">
								<div className="bottom-nav">
									<div
										className="indicator"
										style={{ transform: `translateX(${activeIndex * 48}px)` }}
									/>

									<button
										className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
										onClick={() => setActiveTab('documents')}
									>
										<FileText size={18} strokeWidth={activeTab === 'documents' ? 2 : 1.5} />
									</button>
									<button
										className={`nav-item ${activeTab === 'record' ? 'active' : ''}`}
										onClick={() => setActiveTab('record')}
									>
										<Mic size={18} strokeWidth={activeTab === 'record' ? 2 : 1.5} />
									</button>
									<button
										className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
										onClick={() => setActiveTab('settings')}
									>
										<Settings size={18} strokeWidth={activeTab === 'settings' ? 2 : 1.5} />
									</button>
								</div>
								<div className="home-indicator" />
							</div>
						</div>
					</div>
				</div>

				{/* Realistic shadow */}
				<div className="phone-shadow" />
			</div>

			{/* Floating notifications */}
			<div className="notification notification-success">
				<CheckCircle2 size={16} strokeWidth={2.5} />
				<span>{t('landing.phone.invoiceCreated')}</span>
			</div>
			<div className="notification notification-sent">
				<CheckCircle2 size={16} strokeWidth={2.5} />
				<span>{t('landing.phone.sentToClient')}</span>
			</div>
		</div>
	);
}
