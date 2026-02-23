import { useState } from 'preact/hooks';
import { Wrench, ChevronRight, X, Layers } from 'lucide-react';
import type { Service } from '@/lib/api/services';

interface ServiceTemplatePickerProps {
  services: Service[];
  onSelect: (service: Service) => void;
  onDismiss: () => void;
}

export function ServiceTemplatePicker({
  services,
  onSelect,
  onDismiss,
}: ServiceTemplatePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (services.length === 0) return null;

  return (
    <div class="svc-picker">
      <header class="svc-picker-header">
        <div class="svc-picker-header-row">
          <div class="svc-picker-header-content">
            <Wrench size={18} />
            <h3 class="svc-picker-title">Service Templates</h3>
          </div>
          <button
            class="svc-picker-close"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
        <p class="svc-picker-subtitle">Load line items from a saved template</p>
      </header>

      <div class="svc-picker-content">
        <div class="svc-picker-list">
          {services.map((service, i) => {
            const itemCount = service.items.length;
            const optionCount = service.items.reduce(
              (sum, item) => sum + item.materialOptions.length,
              0
            );
            return (
              <button
                key={service.id}
                class={`svc-picker-card ${hoveredId === service.id ? 'hovered' : ''}`}
                onClick={() => onSelect(service)}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div class="svc-picker-icon">
                  <Layers size={18} />
                </div>
                <div class="svc-picker-info">
                  <span class="svc-picker-name">{service.name}</span>
                  <div class="svc-picker-meta">
                    <span class="svc-picker-count">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    {optionCount > 0 && (
                      <>
                        <span class="svc-picker-sep">-</span>
                        <span class="svc-picker-count">
                          {optionCount} {optionCount === 1 ? 'option' : 'options'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} class="svc-picker-arrow" />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .svc-picker {
          display: flex;
          flex-direction: column;
          background: var(--color-bg-secondary, #dbe8f4);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--color-border, #e2e8f0);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .svc-picker-header {
          padding: 16px 20px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .svc-picker-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .svc-picker-header-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-accent, #0684c7);
        }

        .svc-picker-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text, #0f172a);
          margin: 0;
        }

        .svc-picker-subtitle {
          font-size: 13px;
          color: var(--color-text-secondary, #64748b);
          margin: 0;
        }

        .svc-picker-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.04);
          border: none;
          border-radius: 8px;
          color: var(--color-text-secondary, #64748b);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .svc-picker-close:hover {
          background: rgba(0, 0, 0, 0.08);
          color: var(--color-text, #0f172a);
        }

        .svc-picker-content {
          padding: 12px 16px 16px;
          max-height: 280px;
          overflow-y: auto;
        }

        .svc-picker-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .svc-picker-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          animation: svc-fadeInUp 0.3s ease forwards;
          opacity: 0;
          font-family: inherit;
          width: 100%;
        }

        @keyframes svc-fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .svc-picker-card:hover,
        .svc-picker-card.hovered {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(6, 132, 199, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .svc-picker-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 132, 199, 0.1);
          border-radius: 10px;
          color: var(--color-accent, #0684c7);
          flex-shrink: 0;
        }

        .svc-picker-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .svc-picker-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .svc-picker-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-secondary, #64748b);
        }

        .svc-picker-sep {
          opacity: 0.5;
        }

        .svc-picker-arrow {
          color: var(--color-text-secondary, #cbd5e1);
          flex-shrink: 0;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .svc-picker-card:hover .svc-picker-arrow {
          color: var(--color-accent, #0684c7);
          transform: translateX(2px);
        }

        .svc-picker-content::-webkit-scrollbar { width: 4px; }
        .svc-picker-content::-webkit-scrollbar-track { background: transparent; }
        .svc-picker-content::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        :global(.dark) .svc-picker {
          background: var(--color-bg-secondary, #171717);
          border-color: var(--color-border, #262626);
        }

        :global(.dark) .svc-picker-card {
          background: rgba(255, 255, 255, 0.05);
        }

        :global(.dark) .svc-picker-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        :global(.dark) .svc-picker-close {
          background: rgba(255, 255, 255, 0.06);
        }

        @media (prefers-reduced-motion: reduce) {
          .svc-picker-card {
            animation: none;
            opacity: 1;
          }
          .svc-picker-card:hover { transform: none; }
        }

        @media (max-width: 480px) {
          .svc-picker-header { padding: 14px 16px 10px; }
          .svc-picker-content { padding: 10px 12px 14px; }
          .svc-picker-icon { width: 36px; height: 36px; }
        }
      `}</style>
    </div>
  );
}
