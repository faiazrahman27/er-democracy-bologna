"use client";

import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";

export function ConsultationsHeroActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <SecondaryLink href="/articles">Read articles</SecondaryLink>
        <PrimaryLink href="/login">Sign in to participate</PrimaryLink>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <SecondaryLink href="/articles">Read articles</SecondaryLink>

      {!isAuthenticated ? (
        <PrimaryLink href="/login">Sign in to participate</PrimaryLink>
      ) : isAdminRole(user.role) ? (
        <PrimaryLink href="/admin">Admin area</PrimaryLink>
      ) : (
        <PrimaryLink href="/dashboard">My dashboard</PrimaryLink>
      )}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center border border-green-700 bg-green-700 px-6 text-sm font-black text-white shadow-[0_18px_44px_rgba(22,163,74,0.20)] transition duration-300 hover:-translate-y-1 hover:bg-green-800 hover:shadow-[0_26px_64px_rgba(22,163,74,0.28)] active:-translate-y-1 active:scale-[0.98] active:bg-green-800 sm:w-auto"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 w-full items-center justify-center border border-slate-300 bg-white px-6 text-sm font-black text-slate-950 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-green-600 hover:text-green-700 hover:shadow-md active:-translate-y-1 active:scale-[0.98] active:border-green-600 active:text-green-700 sm:w-auto"
    >
      {children}
    </Link>
  );
}
