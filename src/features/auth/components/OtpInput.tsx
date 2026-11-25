import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({ value, onChange, disabled = false, error }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  const setDigitAt = (index: number, char: string) => {
    const clean = char.replace(/\D/g, '');
    if (!clean) {
      const next = digits.map((d, i) => (i === index ? '' : d)).join('');
      onChange(next);
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      onChange(pasted);
      const focusIdx = Math.min(pasted.length - 1, 5);
      inputsRef.current[focusIdx]?.focus();
      return;
    }

    const arr = [...digits];
    arr[index] = clean;
    onChange(arr.join(''));
    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const arr = [...digits];
      arr[index - 1] = '';
      onChange(arr.join(''));
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      const focusIdx = Math.min(pasted.length - 1, 5);
      inputsRef.current[focusIdx]?.focus();
    }
  };

  return (
    <div>
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit verification code">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            autoFocus={index === 0}
            maxLength={6}
            disabled={disabled}
            aria-label={`Verification code digit ${index + 1}`}
            value={digit}
            onChange={(e) => setDigitAt(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`h-12 w-full rounded-md border bg-[var(--bg-canvas)] text-center font-mono text-lg font-semibold tabular-nums text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              error
                ? 'border-[var(--brand-crimson)] focus:border-[var(--brand-crimson)] focus:ring-[var(--brand-crimson-soft)]'
                : 'border-[var(--border-subtle)] focus:border-[var(--brand-emerald)] focus:ring-[var(--brand-emerald-soft)]'
            }`}
          />
        ))}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-[var(--brand-crimson-text)]">{error}</p>
      ) : null}
    </div>
  );
}
