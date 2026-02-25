import { useState, useEffect, useCallback, useRef, useMemo } from 'preact/hooks';
import { Keyboard, FileText, X, User, Sparkles } from 'lucide-react';
import { useI18nStore } from '@/lib/i18n';
import { useToastStore } from '@/stores/toastStore';
import { deleteReviewSession } from '@/lib/api/reviews';
import { useAppStateStore } from '@/stores/appStateStore';
import { useInputPreferencesStore, type InputMode } from '@/stores/inputPreferencesStore';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { RecordButtonMobile } from '@/components/ui/RecordButtonMobile';
import { Link } from 'wouter';
import { navigateTo } from '@/lib/navigation';

const PENDING_REVIEW_PREVIEW_LENGTH = 80;

interface PendingReview {
  id: string;
  status: string;
  intent_type: string;
  summary: string | null;
  created_at: string;
  parsed_data: Record<string, unknown> | null;
  original_transcript: string | null;
  actions: Array<{ type: string; status: string }> | null;
}

interface DashboardHomeProps {
  firstName: string;
  pendingReview: PendingReview | null;
}

export function DashboardHome({ firstName, pendingReview }: DashboardHomeProps) {
  const { t } = useI18nStore();
  const toast = useToastStore();
  const { setRecordingMode } = useAppStateStore();
  const { mode: storedMode } = useInputPreferencesStore();

  const voice = useVoiceRecording();
  const transcriptTextareaRef = useRef<HTMLTextAreaElement>(null);

  const hasName = firstName.length > 0;
  const [nameBannerDismissed, setNameBannerDismissed] = useState(true);
  const [pendingReviewDismissed, setPendingReviewDismissed] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>(storedMode);

  const currentState = voice.currentState;
  const transcript = voice.transcript;
  const interimTranscript = voice.interimTranscript;
  const displayTranscript = voice.displayTranscript;
  const audioLevel = voice.audioLevel;
  const error = voice.error;
  const isRecordingActive = voice.isRecordingActive;
  const showNoisySuggestion = voice.showNoisySuggestion;

  const isPaused = currentState === 'paused';
  const isProcessing = currentState === 'processing';
  const isRecordingMode = currentState !== 'idle';

  const canGenerate = useMemo(
    () => transcript.trim().length > 0 && currentState !== 'recording' && currentState !== 'processing',
    [transcript, currentState]
  );

  // Sync recording mode to global store for BottomNav visibility
  useEffect(() => {
    setRecordingMode(currentState !== 'idle');
  }, [currentState, setRecordingMode]);

  // Auto-scroll transcript textarea when content changes during recording
  useEffect(() => {
    if (transcriptTextareaRef.current && isRecordingActive) {
      transcriptTextareaRef.current.scrollTop = transcriptTextareaRef.current.scrollHeight;
    }
  }, [displayTranscript, isRecordingActive]);

  // Fetch deepgram key on mount
  useEffect(() => {
    voice.fetchDeepgramKey();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voice.stopRecording();
    };
  }, []);

  // Init name banner from localStorage
  useEffect(() => {
    setNameBannerDismissed(localStorage.getItem('nameBannerDismissed') === 'true');
  }, []);

  // Sync input mode from store
  useEffect(() => {
    setInputMode(storedMode);
  }, [storedMode]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleButtonAction = useCallback(() => {
    if (currentState === 'idle') {
      voice.startRecording(t);
    } else if (currentState === 'recording') {
      voice.pauseRecording();
    } else if (currentState === 'paused') {
      if (!voice.hasMediaRecorder) {
        voice.startRecording(t);
      } else {
        voice.resumeRecording();
      }
    }
  }, [currentState, t, voice]);

  const handleGenerate = useCallback(async () => {
    if (!transcript.trim()) return;

    const savedTranscript = transcript.trim();
    voice.stopMediaResources();
    voice.setCurrentState('processing');

    // Clear any existing pending review when starting a new one
    if (pendingReview?.id) {
      try {
        await deleteReviewSession(pendingReview.id);
      } catch (e) {
        console.error('Failed to clear pending review:', e);
      }
    }
    setPendingReviewDismissed(true);

    try {
      sessionStorage.setItem('review_transcript', savedTranscript);
      navigateTo('/dashboard/review');
    } catch {
      voice.setError('Failed to generate document');
      voice.setCurrentState('idle');
    }
  }, [transcript, pendingReview, voice]);

  const handleTranscriptChange = useCallback((e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    voice.setTranscript(target.value);
  }, [voice]);

  const startTypingMode = useCallback(() => {
    setInputMode('text');
    voice.setCurrentState('paused');
    voice.setTranscript('');
  }, [voice]);

  const dismissNameBanner = useCallback(() => {
    setNameBannerDismissed(true);
    localStorage.setItem('nameBannerDismissed', 'true');
  }, []);

  const dismissPendingReview = useCallback(async () => {
    if (!pendingReview?.id) {
      setPendingReviewDismissed(true);
      return;
    }

    try {
      const result = await deleteReviewSession(pendingReview.id);

      if (result.success) {
        setPendingReviewDismissed(true);
      } else {
        toast.error('Failed to delete draft');
      }
    } catch (err) {
      console.error('Failed to delete pending review:', err);
      toast.error('Failed to delete draft');
    }
  }, [pendingReview, toast]);

  const resumePendingReview = useCallback(() => {
    if (pendingReview?.id) {
      navigateTo(`/dashboard/review?session=${pendingReview.id}`);
    }
  }, [pendingReview]);

  const getPendingReviewSummary = useCallback((): string => {
    if (!pendingReview) return '';
    const clientName = (pendingReview.parsed_data as Record<string, any>)?.client?.name;
    if (clientName) return clientName;
    if (pendingReview.summary) return pendingReview.summary;
    if (pendingReview.original_transcript) {
      return pendingReview.original_transcript.slice(0, PENDING_REVIEW_PREVIEW_LENGTH) + '...';
    }
    return t('dashboard.unfinishedDoc');
  }, [pendingReview, t]);

  if (isProcessing) {
    return (
      <main class="dashboard-page">
        <div class="processing-ui">
          <div class="processing-visual">
            <div class="processing-ring" />
            <div class="processing-ring inner" />
            <div class="processing-icon">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
          </div>
          <h2 class="processing-title">{t('dashboard.processing')}</h2>
          <p class="processing-desc">{t('dashboard.aiUnderstanding')}</p>
          <div class="processing-steps">
            <div class="step active">
              <div class="step-dot" />
              <span>{t('dashboard.parsingRequest')}</span>
            </div>
            <div class="step">
              <div class="step-dot" />
              <span>{t('dashboard.identifyingType')}</span>
            </div>
            <div class="step">
              <div class="step-dot" />
              <span>{t('dashboard.extractingDetails')}</span>
            </div>
          </div>
        </div>
        <style>{componentStyles}</style>
      </main>
    );
  }

  return (
    <main class="dashboard-page">
      <div class="idle-ui">
        {/* Name Suggestion Banner */}
        {!hasName && !nameBannerDismissed && (
          <div class="name-banner">
            <User size={18} />
            <div class="name-banner-content">
              <strong>{t('dashboard.addNameTitle')}</strong>
              <span>{t('dashboard.addNameMessage')}</span>
            </div>
            <Link href="/dashboard/settings/profile" class="name-banner-btn">
              {t('dashboard.addNameAction')}
            </Link>
            <button class="name-banner-close" onClick={dismissNameBanner}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Noise suggestion hint */}
        {showNoisySuggestion && (
          <div class="noise-hint">
            <span>{t('dashboard.noisySuggestion')}</span>
            <button
              class="noise-hint-dismiss"
              onClick={() => voice.dismissNoisySuggestion()}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main Content — grid keeps sphere dead center */}
        <div class="idle-content">
          {/* Top spacer — mirrors bottom to keep center row fixed */}
          <div class="idle-spacer" />

          <section class="record-section">
            <div class="record-wrapper" data-tutorial="voice-button">
              <RecordButtonMobile
                isRecording={isRecordingActive || isPaused}
                isPaused={isPaused}
                audioLevel={audioLevel}
                onClick={handleButtonAction}
              />
            </div>

            {/* Status text */}
            {isRecordingActive ? (
              <p class="record-hint">{t('recording.listening')}</p>
            ) : isPaused ? (
              <p class="record-hint">{t('dashboard.tapToResume')}</p>
            ) : (
              <p class="record-hint">{t('recording.tapToStart')}</p>
            )}
          </section>

          <div class="below-button">
            {!isRecordingActive && (
              <button class="type-option" onClick={startTypingMode}>
                <Keyboard size={16} strokeWidth={2} />
                <span>{t('dashboard.orTypeInstead')}</span>
              </button>
            )}

            {pendingReview && !pendingReviewDismissed && !isRecordingActive && (
              <div
                class="pending-review-card"
                role="button"
                tabIndex={0}
                onClick={resumePendingReview}
                onKeyDown={(e) => (e as KeyboardEvent).key === 'Enter' && resumePendingReview()}
              >
                <div class="pending-review-icon">
                  <FileText size={16} strokeWidth={2} />
                </div>
                <span>{t('dashboard.continueDraft')}</span>
                <button
                  class="pending-review-dismiss"
                  onClick={(e) => { e.stopPropagation(); dismissPendingReview(); }}
                  aria-label="Dismiss draft"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Transcript Popup */}
      {isRecordingMode && (
        <div class={`transcript-popup ${displayTranscript.length > 0 ? 'has-content' : ''}`}>
          {/* Header with status and controls */}
          <div class="popup-header">
            <div class="popup-status">
              {isRecordingActive ? (
                <>
                  <span class="popup-dot recording" />
                  <span class="popup-label">{t('recording.listening')}</span>
                </>
              ) : (
                <span class="popup-label">{t('recording.transcript')}</span>
              )}
            </div>
            <div class="popup-actions">
              <button
                class="popup-close-btn"
                onClick={() => voice.stopRecording()}
                aria-label={t('common.cancel')}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Transcript content */}
          <div class="popup-content">
            <textarea
              ref={transcriptTextareaRef}
              class="popup-textarea"
              value={displayTranscript}
              onInput={handleTranscriptChange}
              placeholder={
                inputMode === 'text'
                  ? t('placeholder.typeRequest')
                  : t('dashboard.wordsAppearHere')
              }
              spellcheck={false}
              autocomplete="off"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
            />
            {interimTranscript && inputMode === 'voice' && (
              <span class="popup-listening">
                <span class="dot" />
                <span class="dot" />
                <span class="dot" />
              </span>
            )}
          </div>

          {/* Generate button */}
          <button
            class={`popup-generate ${canGenerate ? 'ready' : ''}`}
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            <Sparkles size={18} strokeWidth={2} />
            <span>{t('dashboard.generate')}</span>
          </button>
        </div>
      )}

      <style>{componentStyles}</style>
    </main>
  );
}

const componentStyles = `
  .dashboard-page {
    position: relative;
    width: 100%;
    height: 100dvh;
    background: transparent;
    overflow: hidden;
  }

  /* ========== IDLE STATE ========== */
  .idle-ui {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  /* Name Suggestion Banner */
  .name-banner {
    position: absolute;
    top: calc(var(--space-3, 12px) + var(--safe-area-top, 0px));
    left: var(--page-padding-x, 20px);
    right: var(--page-padding-x, 20px);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    padding: var(--space-3, 12px) var(--space-4, 16px);
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: var(--radius-lg, 16px);
    color: #d97706;
  }

  .name-banner svg {
    flex-shrink: 0;
  }

  .name-banner-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .name-banner-content strong {
    font-size: var(--text-sm, 14px);
    font-weight: var(--font-semibold, 600);
    color: #b45309;
  }

  .name-banner-content span {
    font-size: var(--text-xs, 12px);
    color: #d97706;
    opacity: 0.9;
  }

  .name-banner-btn {
    flex-shrink: 0;
    padding: var(--space-2, 8px) var(--space-3, 12px);
    background: rgba(245, 158, 11, 0.2);
    border: none;
    border-radius: var(--radius-md, 12px);
    font-size: var(--text-xs, 12px);
    font-weight: var(--font-semibold, 600);
    color: #b45309;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .name-banner-btn:hover {
    background: rgba(245, 158, 11, 0.3);
  }

  .name-banner-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md, 12px);
    color: #d97706;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .name-banner-close:hover {
    background: rgba(245, 158, 11, 0.2);
  }

  /* Noise suggestion hint */
  .noise-hint {
    position: absolute;
    top: calc(var(--space-3, 12px) + var(--safe-area-top, 0px));
    left: var(--page-padding-x, 20px);
    right: var(--page-padding-x, 20px);
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
    padding: var(--space-3, 12px) var(--space-4, 16px);
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: var(--radius-lg, 16px);
    font-size: var(--text-sm, 14px);
    color: #a16207;
  }

  .noise-hint span {
    flex: 1;
  }

  .noise-hint-dismiss {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md, 12px);
    color: #a16207;
    cursor: pointer;
  }

  .noise-hint-dismiss:hover {
    background: rgba(234, 179, 8, 0.2);
  }

  /* Pending Review Card — matches .type-option sizing */
  .pending-review-card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 8px);
    padding: var(--space-3, 12px) var(--space-5, 20px);
    padding-right: 36px;
    background: var(--glass-blu-light-90, rgba(255, 255, 255, 0.9));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--gray-200, #e2e8f0);
    border-radius: var(--radius-full, 9999px);
    font-size: var(--text-sm, 14px);
    font-weight: var(--font-medium, 500);
    color: var(--blu-primary, #0066ff);
    cursor: pointer;
    margin-top: 10px;
    box-shadow: 0 4px 20px var(--glass-black-10, rgba(0, 0, 0, 0.06));
    transition: all 0.15s ease;
  }

  .pending-review-card:hover {
    background: var(--glass-blu-light-95, rgba(255, 255, 255, 0.95));
    box-shadow: 0 8px 32px var(--glass-black-10, rgba(0, 0, 0, 0.06));
    transform: translateY(-1px);
  }

  .pending-review-card:active {
    transform: scale(0.98);
  }

  .pending-review-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--blu-primary, #0066ff);
  }

  .pending-review-dismiss {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--gray-400, #94a3b8);
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .pending-review-dismiss:hover {
    background: var(--gray-100, #f1f5f9);
    color: var(--gray-600, #475569);
  }

  .idle-content {
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    align-items: center;
    justify-items: center;
    height: 100%;
    padding: 0 var(--page-padding-x, 20px);
  }

  .idle-spacer {
    /* empty top row — mirrors bottom to keep center pinned */
  }

  /* Record Section */
  .record-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .below-button {
    align-self: start;
    justify-self: center;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding-top: 4px;
  }

  .record-wrapper {
    margin-bottom: 16px;
  }

  .record-hint {
    font-size: var(--text-base, 16px);
    color: var(--gray-400, #94a3b8);
    margin: 0 0 var(--space-4, 16px) 0;
  }

  .type-option {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 8px);
    padding: var(--space-3, 12px) var(--space-5, 20px);
    background: var(--glass-blu-light-90, rgba(255, 255, 255, 0.9));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--gray-200, #e2e8f0);
    border-radius: var(--radius-full, 9999px);
    font-size: var(--text-sm, 14px);
    font-weight: var(--font-medium, 500);
    color: var(--gray-600, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 4px 20px var(--glass-black-10, rgba(0, 0, 0, 0.06));
  }

  .type-option:hover {
    background: var(--glass-blu-light-95, rgba(255, 255, 255, 0.95));
    border-color: var(--gray-200, #e2e8f0);
    color: var(--gray-700, #334155);
    box-shadow: 0 8px 32px var(--glass-black-10, rgba(0, 0, 0, 0.06));
    transform: translateY(-1px);
  }

  .type-option:active {
    transform: scale(0.98);
  }

  /* ========== FLOATING TRANSCRIPT POPUP ========== */
  .transcript-popup {
    position: fixed;
    bottom: calc(16px + var(--safe-area-bottom, 0px));
    left: var(--page-padding-x, 20px);
    right: var(--page-padding-x, 20px);
    max-width: 500px;
    max-height: 70dvh;
    margin: 0 auto;
    background: var(--glass-blu-light-95, rgba(255, 255, 255, 0.95));
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: none;
    border-radius: var(--radius-2xl, 24px);
    box-shadow:
      0 8px 40px var(--glass-black-10, rgba(0, 0, 0, 0.06)),
      0 2px 8px var(--glass-black-5, rgba(0, 0, 0, 0.03));
    z-index: var(--z-fixed, 100);
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    animation: slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  @keyframes slideUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .transcript-popup.has-content {
    box-shadow:
      0 8px 40px var(--glass-primary-15, rgba(0, 102, 255, 0.1)),
      0 2px 8px var(--glass-black-5, rgba(0, 0, 0, 0.03));
  }

  /* Popup Header */
  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3, 12px) var(--space-4, 16px);
  }

  .popup-status {
    display: flex;
    align-items: center;
    gap: var(--space-2, 8px);
  }

  .popup-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full, 9999px);
  }

  .popup-dot.recording {
    background: var(--blu-primary, #0066ff);
    animation: dot-breathe 2s ease-in-out infinite;
  }

  @keyframes dot-breathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .popup-label {
    font-size: var(--text-xs, 12px);
    font-weight: var(--font-semibold, 600);
    color: var(--gray-500, #64748b);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide, 0.025em);
  }

  .popup-actions {
    display: flex;
    align-items: center;
    gap: var(--space-1-5, 6px);
  }

  .popup-close-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gray-100, #f1f5f9);
    border: none;
    border-radius: var(--radius-md, 12px);
    color: var(--gray-500, #64748b);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .popup-close-btn:hover {
    background: var(--glass-red-10, rgba(239, 68, 68, 0.1));
    color: var(--data-red, #ef4444);
  }

  .popup-close-btn:active {
    transform: scale(0.92);
  }

  /* Popup Content */
  .popup-content {
    position: relative;
    padding: var(--space-3, 12px) var(--space-4, 16px);
  }

  .popup-textarea {
    width: 100%;
    height: 180px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--gray-900, #0f172a);
    font-size: var(--text-lg, 18px);
    font-weight: var(--font-normal, 400);
    line-height: var(--leading-relaxed, 1.625);
    resize: none;
    font-family: inherit;
    transition: height 0.2s cubic-bezier(0.32, 0.72, 0, 1);
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-appearance: none;
    -webkit-overflow-scrolling: touch;
    -webkit-text-decoration: none;
    text-decoration: none;
    box-sizing: border-box;
  }

  .popup-textarea::spelling-error,
  .popup-textarea::grammar-error {
    text-decoration: none;
    background: none;
  }

  .popup-textarea::placeholder {
    color: var(--gray-400, #94a3b8);
  }

  .popup-textarea:focus {
    outline: none;
  }

  /* Listening indicator */
  .popup-listening {
    position: absolute;
    bottom: var(--space-3, 12px);
    left: var(--space-4, 16px);
    display: flex;
    align-items: center;
    gap: var(--space-1, 4px);
  }

  .popup-listening .dot {
    width: 5px;
    height: 5px;
    background: var(--blu-primary, #0066ff);
    border-radius: var(--radius-full, 9999px);
    animation: listening-bounce 1.4s ease-in-out infinite;
  }

  .popup-listening .dot:nth-child(1) {
    animation-delay: 0s;
  }
  .popup-listening .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .popup-listening .dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes listening-bounce {
    0%, 80%, 100% {
      transform: scale(1);
      opacity: 0.4;
    }
    40% {
      transform: scale(1.3);
      opacity: 1;
    }
  }

  /* Generate Button */
  .popup-generate {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 8px);
    width: calc(100% - var(--space-8, 32px));
    margin: 0 var(--space-4, 16px) var(--space-4, 16px);
    padding: var(--space-3-5, 14px) var(--space-6, 24px);
    background: var(--gray-200, #e2e8f0);
    border: none;
    border-radius: var(--radius-lg, 16px);
    color: var(--gray-400, #94a3b8);
    font-size: var(--text-base, 16px);
    font-weight: var(--font-semibold, 600);
    cursor: not-allowed;
    transition: all 0.2s ease;
  }

  .popup-generate.ready {
    background: var(--avatar-gradient-1, linear-gradient(135deg, #0066ff 0%, #0ea5e9 100%));
    color: var(--white, #fff);
    cursor: pointer;
    box-shadow: 0 4px 12px var(--glass-primary-25, rgba(0, 102, 255, 0.25));
  }

  .popup-generate.ready:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px var(--glass-primary-35, rgba(0, 102, 255, 0.35));
  }

  .popup-generate.ready:active {
    transform: scale(0.98);
  }

  /* ========== PROCESSING STATE ========== */
  .processing-ui {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
    padding: var(--page-padding-x, 20px);
  }

  .processing-visual {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: var(--space-8, 32px);
  }

  .processing-ring {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-top-color: var(--blu-primary, #0066ff);
    border-radius: var(--radius-full, 9999px);
    animation: processing-spin 1.2s linear infinite;
  }

  .processing-ring.inner {
    inset: 15px;
    border-top-color: var(--glass-primary-40, rgba(0, 102, 255, 0.4));
    animation-direction: reverse;
    animation-duration: 0.8s;
  }

  @keyframes processing-spin {
    to { transform: rotate(360deg); }
  }

  .processing-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--blu-primary, #0066ff);
  }

  .processing-title {
    font-family: var(--font-display, inherit);
    font-size: var(--text-xl, 20px);
    font-weight: var(--font-bold, 700);
    color: var(--gray-900, #0f172a);
    margin: 0 0 var(--space-2, 8px) 0;
    letter-spacing: var(--tracking-tight, -0.025em);
  }

  .processing-desc {
    font-size: var(--text-base, 16px);
    color: var(--gray-500, #64748b);
    margin: 0 0 var(--space-8, 32px) 0;
  }

  .processing-steps {
    display: flex;
    flex-direction: column;
    gap: var(--space-3, 12px);
  }

  .step {
    display: flex;
    align-items: center;
    gap: var(--space-3, 12px);
    font-size: var(--text-sm, 14px);
    color: var(--gray-400, #94a3b8);
    transition: all 0.2s ease;
  }

  .step.active {
    color: var(--blu-primary, #0066ff);
  }

  .step-dot {
    width: 8px;
    height: 8px;
    background: var(--gray-300, #cbd5e1);
    border-radius: var(--radius-full, 9999px);
    transition: all 0.2s ease;
  }

  .step.active .step-dot {
    background: var(--blu-primary, #0066ff);
    animation: dot-pulse 1s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.4); opacity: 0.7; }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .type-option,
    .step,
    .step-dot,
    .transcript-popup,
    .popup-textarea,
    .popup-close-btn,
    .popup-generate {
      transition: none;
    }

    .popup-dot.recording,
    .step.active .step-dot,
    .processing-ring,
    .popup-listening .dot {
      animation: none;
    }

    .transcript-popup {
      animation: none;
    }
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .name-banner {
      margin: 0 12px var(--space-3, 12px);
      padding: var(--space-2-5, 10px) var(--space-3, 12px);
      gap: var(--space-2, 8px);
    }

    .name-banner-content span {
      display: none;
    }

    .name-banner-btn {
      padding: var(--space-1-5, 6px) var(--space-2-5, 10px);
    }

    .transcript-popup {
      left: 12px;
      right: 12px;
      bottom: calc(12px + var(--safe-area-bottom, 0px));
      border-radius: 20px;
      max-height: 60dvh;
    }

    .popup-header {
      padding: 12px 16px;
    }

    .popup-close-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .popup-content {
      padding: 12px 16px;
    }

    .popup-textarea {
      font-size: 17px;
      height: 150px;
    }

    .popup-generate {
      margin: 0 14px 14px;
      padding: 16px 24px;
      font-size: 16px;
      border-radius: 14px;
    }
  }

  /* Very small screens */
  @media (max-width: 360px) {
    .transcript-popup {
      left: 8px;
      right: 8px;
      bottom: calc(8px + var(--safe-area-bottom, 0px));
    }

    .popup-textarea {
      font-size: 16px;
      height: 130px;
    }

    .popup-generate {
      padding: 14px 20px;
      font-size: 15px;
    }
  }

  /* Handle keyboard visibility on mobile */
  @media (max-height: 500px) {
    .transcript-popup {
      bottom: 8px;
      max-height: 50dvh;
    }

    .popup-textarea {
      height: 100px;
    }

    .idle-ui {
      padding-bottom: 60px;
    }
  }

  /* Ensure touch targets are at least 44px */
  @media (pointer: coarse) {
    .popup-close-btn {
      min-width: 44px;
      min-height: 44px;
    }

    .type-option {
      min-height: 44px;
      padding: 12px 20px;
    }
  }
`;
