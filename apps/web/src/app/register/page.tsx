"use client";

import Link from "next/link";
import {
  FormEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { apiRequest } from "@/lib/api";

type RegisterResponse = {
  message: string;
};

type LiquidStyle = CSSProperties & {
  "--liquid-x"?: string;
  "--liquid-y"?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    if (isAdminRole(user.role)) {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFullName) {
      setError("Full name is required.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and privacy policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        body: {
          fullName: trimmedFullName,
          email: trimmedEmail,
          password,
          termsAccepted: true,
        },
      });

      setSuccessMessage(
        response.message || "Account created successfully. You can sign in now.",
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setTermsAccepted(false);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="grid gap-6">
        <TextField
          id="full-name"
          label="Full name"
          type="text"
          value={fullName}
          onChange={setFullName}
          required
        />

        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />

        <TextField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
        />

        <TextField
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
        />

        <div className="border border-slate-300/70 bg-white/55 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[28px] transition duration-300 hover:border-green-300 hover:bg-white/70 active:border-green-300 active:bg-white/70">
          <label className="flex min-w-0 items-start gap-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 border border-slate-400 accent-green-700"
              required
            />

            <span className="min-w-0 break-words text-sm leading-6 text-slate-700">
              I agree to the{" "}
              <LegalInlineLink href="/terms">Terms of Service</LegalInlineLink>,{" "}
              <LegalInlineLink href="/privacy">Privacy Policy</LegalInlineLink>{" "}
              and <LegalInlineLink href="/cookies">Cookie Policy</LegalInlineLink>.
            </span>
          </label>
        </div>

        {error ? <MessageBlock tone="danger">{error}</MessageBlock> : null}

        {successMessage ? (
          <MessageBlock tone="success">{successMessage}</MessageBlock>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !termsAccepted}
          className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-5 text-sm font-black text-white shadow-[0_20px_54px_rgba(22,163,74,0.24)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_28px_74px_rgba(22,163,74,0.34)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <AuthFooter />
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  function updateLiquidPosition(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty("--liquid-x", `${x}%`);
    event.currentTarget.style.setProperty("--liquid-y", `${y}%`);
  }

  function resetLiquidPosition(event: ReactPointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--liquid-x", "50%");
    event.currentTarget.style.setProperty("--liquid-y", "18%");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <section className="px-5 py-10 sm:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)] lg:items-start">
            <section className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                Create account
              </p>

              <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl md:text-6xl">
                Join the platform for civic participation.
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-8 text-slate-600">
                Create your account to access consultations, participate
                securely, and manage your civic profile in one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/consultations"
                  className="inline-flex min-h-11 w-full items-center justify-center border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-slate-400 active:bg-slate-50 sm:w-auto"
                >
                  Browse consultations →
                </Link>

                <Link
                  href="/login"
                  className="inline-flex min-h-11 w-full items-center justify-center border border-green-500 bg-white px-4 text-sm font-black text-green-700 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-green-50 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:bg-green-50 sm:w-auto"
                >
                  Already have an account? →
                </Link>
              </div>
            </section>

            <section
              onPointerDown={updateLiquidPosition}
              onPointerMove={updateLiquidPosition}
              onPointerLeave={resetLiquidPosition}
              onPointerCancel={resetLiquidPosition}
              className="group/liquid relative isolate min-w-0 touch-manipulation overflow-hidden border border-white/70 bg-transparent px-5 py-8 shadow-[0_34px_110px_rgba(15,23,42,0.18)] backdrop-blur-[40px] transition duration-500 hover:-translate-y-1 hover:border-white hover:shadow-[0_42px_140px_rgba(15,23,42,0.24)] active:-translate-y-1 active:border-white active:shadow-[0_42px_140px_rgba(15,23,42,0.24)] sm:px-7"
              style={
                {
                  "--liquid-x": "50%",
                  "--liquid-y": "18%",
                } as LiquidStyle
              }
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-30"
                style={{
                  background:
                    "radial-gradient(circle at var(--liquid-x) var(--liquid-y), rgba(255,255,255,0.70), rgba(255,255,255,0.18) 16%, transparent 40%), linear-gradient(135deg, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 44%, rgba(255,255,255,0.12))",
                }}
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[1px] -z-20 border border-white/55 bg-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.08)] backdrop-blur-[38px]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 -top-28 -z-10 h-72 w-72 bg-white/18 blur-3xl transition duration-700 group-hover/liquid:translate-x-8 group-hover/liquid:translate-y-8 group-hover/liquid:bg-white/28 group-active/liquid:translate-x-8 group-active/liquid:translate-y-8 group-active/liquid:bg-white/28"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-28 top-12 -z-10 h-64 w-64 bg-white/16 blur-3xl transition duration-700 group-hover/liquid:-translate-x-10 group-hover/liquid:translate-y-8 group-active/liquid:-translate-x-10 group-active/liquid:translate-y-8"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[-100px] left-8 -z-10 h-56 w-72 bg-white/20 blur-3xl transition duration-700 group-hover/liquid:-translate-y-10 group-active/liquid:-translate-y-10"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[-48%] top-9 h-16 w-[190%] -rotate-12 bg-gradient-to-r from-transparent via-white/78 to-transparent opacity-34 blur-[1px] transition duration-700 group-hover/liquid:translate-x-20 group-hover/liquid:opacity-88 group-active/liquid:translate-x-20 group-active/liquid:opacity-88"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-[-30%] top-1/2 h-8 w-[150%] -rotate-12 bg-gradient-to-r from-transparent via-white/44 to-transparent opacity-0 blur-sm transition duration-700 group-hover/liquid:translate-x-14 group-hover/liquid:opacity-70 group-active/liquid:translate-x-14 group-active/liquid:opacity-70"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-white/20 via-white to-white/20"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                  Account setup
                </p>

                <h2 className="mt-3 break-words text-2xl font-black tracking-[-0.045em] text-slate-950">
                  Create your account
                </h2>

                <div className="mt-7">{children}</div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function TextField({
  id,
  label,
  type,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-black text-slate-950"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300/70 bg-white/55 px-3 py-3 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.08),0_18px_50px_rgba(15,23,42,0.08)] outline-none backdrop-blur-[28px] transition duration-300 hover:border-green-300 hover:bg-white/70 focus:border-green-600 focus:bg-white/80 active:border-green-300 active:bg-white/70"
        required={required}
      />
    </div>
  );
}

function AuthFooter() {
  return (
    <div className="mt-7 grid gap-4">
      <p className="text-sm leading-7 text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-black text-green-700 underline underline-offset-4 transition duration-300 hover:text-green-800 active:text-green-800"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function LegalInlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-bold text-slate-900 underline underline-offset-4 transition duration-300 hover:text-green-700 active:text-green-700"
    >
      {children}
    </Link>
  );
}

function MessageBlock({
  tone,
  children,
}: {
  tone: "success" | "danger";
  children: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 text-green-700"
      : "border-red-200 text-red-700";

  return (
    <div
      className={`border-y bg-white/45 px-3 py-4 text-sm font-bold backdrop-blur-[28px] ${toneClass}`}
    >
      {children}
    </div>
  );
}
