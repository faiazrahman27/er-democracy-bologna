"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";

export function HomeHeroActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <PrimaryLink href="/consultations">View consultations</PrimaryLink>
        <SecondaryLink href="/login">Sign in</SecondaryLink>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <PrimaryLink href="/consultations">View consultations</PrimaryLink>

      {!isAuthenticated ? (
        <SecondaryLink href="/login">Sign in</SecondaryLink>
      ) : isAdminRole(user.role) ? (
        <SecondaryLink href="/admin">Admin area</SecondaryLink>
      ) : (
        <SecondaryLink href="/dashboard">My dashboard</SecondaryLink>
      )}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(22,163,74,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_26px_64px_rgba(22,163,74,0.36)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center border border-white/70 bg-white/90 px-6 text-sm font-black text-slate-950 shadow-[0_18px_44px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-green-700 hover:shadow-[0_26px_64px_rgba(15,23,42,0.24)] active:-translate-y-1 active:scale-[0.98] active:bg-white active:text-green-700 sm:w-auto"
    >
      {children}
    </Link>
  );
}
