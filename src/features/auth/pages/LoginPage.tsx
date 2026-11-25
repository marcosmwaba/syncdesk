import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiClientError, getErrorMessage, isForbiddenError } from '../../../core/api';
import { useAuth } from '../../../core/auth';
import {
  EmptyState,
  ForbiddenState,
  LoadingSkeleton,
} from '../../../core/ui';
import { requestAuthCode, verifyAuthCode } from '../api';
import { OtpInput } from '../components/OtpInput';

type LoginStep = 'email' | 'code';

export function LoginPage() {
  const { status, isAuthenticated, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forbidden, setForbidden] = useState(false);
  const [infoNote, setInfoNote] = useState<string | null>(null);

  const nextPath =
    (location.state as { from?: string } | null)?.from || '/board';

  useEffect(() => {
    if (status === 'ready' && isAuthenticated) {
      navigate(nextPath, { replace: true });
    }
  }, [status, isAuthenticated, navigate, nextPath]);

  if (status === 'loading' && isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-12">
        <LoadingSkeleton variant="form" />
      </div>
    );
  }

  if (status === 'forbidden' || forbidden) {
    return (
      <div className="py-10">
        <ForbiddenState
          title="Sign-in restricted"
          description="Your account is not permitted to access this workspace."
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="mx-auto max-w-md py-12">
        <EmptyState
          title="Signed in"
          description="You are already authenticated for this SyncDesk workspace."
          actionLabel="Open dashboard"
          actionTo="/board"
        />
      </div>
    );
  }

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setInfoNote(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldErrors({ email: 'Enter your work email address.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestAuthCode({ email: trimmedEmail });
      setEmail(result.email ?? trimmedEmail);
      setStep('code');
      setCode('');
      setInfoNote(
        result.expiresInSeconds
          ? `A 6-digit sign-in code was sent to ${trimmedEmail}. It expires in ${Math.round(
              result.expiresInSeconds / 60
            )} minutes.`
          : `A 6-digit sign-in code was sent to ${trimmedEmail}.`
      );
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        return;
      }
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setErrorMessage(getErrorMessage(err, 'Unable to send verification code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setFieldErrors({ code: 'Enter all 6 digits from your verification email.' });
      return;
    }

    setSubmitting(true);
    try {
      const tokens = await verifyAuthCode({
        email: email.trim(),
        code: cleanCode,
      });
      await loginWithTokens(tokens);
      navigate(nextPath, { replace: true });
    } catch (err) {
      if (isForbiddenError(err)) {
        setForbidden(true);
        return;
      }
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setErrorMessage(getErrorMessage(err, 'Invalid or expired verification code.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl grid-cols-1 items-center gap-10 py-6 lg:grid-cols-12 lg:gap-12">
      {/* Left Architectural Workspace Intro */}
      <div className="space-y-6 lg:col-span-6">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--brand-emerald-text)]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>Multi-department service operations</span>
        </div>

        <h1 className="text-balance text-3xl leading-[1.15] font-semibold text-[var(--text-primary)] sm:text-4xl">
          Coordinated requests, incidents, and changes in one place.
        </h1>

        <p className="max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">
          Route work across departments with live operational visibility, structured intake forms, and capability-based access control.
        </p>

        <ul className="space-y-3 pt-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-emerald-text)]"
              aria-hidden="true"
            />
            <span>Live multi-department workload board with real-time queue status</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-copper-text)]"
              aria-hidden="true"
            />
            <span>Dynamic department intake forms configured directly by your workspace</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-emerald-text)]"
              aria-hidden="true"
            />
            <span>Passwordless 6-digit email verification for fast, secure sign-in</span>
          </li>
        </ul>
      </div>

      {/* Right Sign-In Card */}
      <div className="lg:col-span-6">
        <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card-hover)]">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {step === 'email' ? 'Sign in to SyncDesk' : 'Enter verification code'}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
              {step === 'email'
                ? 'Enter your email address to receive a one-time 6-digit access code.'
                : `Verify your identity for ${email}.`}
            </p>

            {infoNote ? (
              <div className="mt-4 rounded-lg border border-[var(--brand-emerald-border)] bg-[var(--brand-emerald-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-emerald-text)]">
                {infoNote}
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-[var(--brand-crimson-border)] bg-[var(--brand-crimson-soft)] px-3.5 py-2.5 text-xs text-[var(--brand-crimson-text)]"
              >
                {errorMessage}
              </div>
            ) : null}

            {step === 'email' ? (
              <form onSubmit={handleRequestCode} className="mt-6 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      autoFocus
                      placeholder="name@organization.org"
                      value={email}
                      disabled={submitting}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-2 pr-3 pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--brand-emerald)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-emerald-soft)]"
                    />
                  </div>
                  {fieldErrors.email ? (
                    <p className="mt-1.5 text-xs text-[var(--brand-crimson-text)]">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] shadow-[var(--shadow-subtle)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? 'Sending code...' : 'Continue with email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-5" noValidate>
                <div>
                  <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                    6-digit verification code
                  </label>
                  <OtpInput
                    value={code}
                    onChange={setCode}
                    disabled={submitting}
                    error={fieldErrors.code}
                  />
                </div>

                <div className="space-y-2.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-emerald)] px-4 py-2 text-sm font-medium text-[var(--brand-emerald-fg)] shadow-[var(--shadow-subtle)] transition-colors hover:bg-[var(--brand-emerald-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 whitespace-nowrap"
                  >
                    {submitting ? 'Verifying...' : 'Verify and sign in'}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setErrorMessage(null);
                        setFieldErrors({});
                        setInfoNote(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Change email
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => void handleRequestCode(e)}
                      className="text-xs font-medium text-[var(--brand-emerald-text)] hover:underline whitespace-nowrap"
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 text-center">
              <Link
                to="/board"
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--brand-emerald-text)]"
              >
                View open operations board →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
