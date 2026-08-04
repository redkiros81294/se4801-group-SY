import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

interface TourStep {
  icon: string;
  title: string;
  body: string;
  accent: string;
  cta?: string;
  to?: string;
}

const STEPS: TourStep[] = [
  {
    icon: 'ti ti-building-factory',
    title: '1 · A manufacturer registers a product',
    body: 'PharmaCorp creates a product (e.g. Paracetamol 500mg), then a batch — one production run with a unique batch number. The system is role-based: only MANUFACTURER organizations can do this.',
    accent: 'var(--cyan)',
  },
  {
    icon: 'ti ti-qrcode',
    title: '2 · A QR code is minted',
    body: 'Each batch gets a unique QR token. Print it, stick it on the packaging — anyone can now verify this product.',
    accent: 'var(--blue)',
  },
  {
    icon: 'ti ti-truck',
    title: '3 · Every movement is hash-chained',
    body: 'Shipper logs SHIPPED / IN_TRANSIT, retailer logs RECEIVED. Each event stores a SHA-256 hash of its data plus the previous event\u2019s hash — a tamper-evident chain.',
    accent: 'var(--amber)',
  },
  {
    icon: 'ti ti-scan',
    title: '4 · Scan to verify — in seconds',
    body: 'Open the public verification portal, paste the token (or scan the QR with your phone camera), and see the full provenance timeline instantly. No login required.',
    accent: 'var(--green)',
    cta: 'Try the public portal',
    to: '/verify',
  },
  {
    icon: 'ti ti-shield-alert',
    title: '5 · Tampering is detected',
    body: 'If anyone edits a record, the chain breaks and the batch is flagged COMPROMISED — exactly what a compliance officer or regulator needs to see. The demo seed includes a tampered batch to show this.',
    accent: 'var(--red)',
  },
];

export const DemoTour = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="ChainTrack demo tour"
    >
      <div className="w-full max-w-lg bg-[var(--bg1)] border border-[var(--border)]/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-[var(--bg2)]">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: current.accent }}
          />
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${current.accent}18`, color: current.accent }}
            >
              <i className={`ti ${current.icon}`} aria-hidden="true" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close tour"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] hover:bg-[var(--bg2)] transition-colors"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-[var(--t1)] mb-3">{current.title}</h2>
          <p className="text-[var(--t2)] leading-relaxed mb-8 min-h-[84px]">{current.body}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    i === step ? 'w-6' : 'w-2 bg-[var(--bg3)] hover:bg-[var(--t3)]'
                  )}
                  style={i === step ? { backgroundColor: current.accent } : undefined}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {current.to && (
                <button
                  onClick={() => navigate(current.to!)}
                  className="px-4 py-2.5 rounded-lg bg-[var(--cyan)]/15 text-[var(--cyan)] text-sm font-medium hover:bg-[var(--cyan)]/25 transition-colors"
                >
                  {current.cta ?? 'Try it'}
                </button>
              )}
              <button
                onClick={next}
                className="px-6 py-2.5 rounded-lg text-[var(--t1)] font-medium transition-colors"
                style={{ backgroundColor: current.accent }}
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <i className="ti ti-arrow-right ml-2" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
