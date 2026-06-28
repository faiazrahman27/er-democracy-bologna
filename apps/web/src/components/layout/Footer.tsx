"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useAuth } from "@/providers/auth-provider";
import { isAdminRole } from "@/lib/roles";
import { hasPermission } from "@/lib/permissions";
import { ADMIN_NAV, PUBLIC_NAV } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export default function Footer() {
  const { user } = useAuth();

  const isAuthenticated = !!user;
  const isAdminUser = !!user && isAdminRole(user.role);

  const visibleAdminNav = useMemo(() => {
    if (!user) {
      return ADMIN_NAV.filter((item) => !item.permission);
    }

    return ADMIN_NAV.filter((item) => {
      if (!item.permission) {
        return true;
      }

      return hasPermission(user.role, item.permission);
    });
  }, [user]);

  return (
    <footer className="mt-20 bg-white text-slate-800">
      <div className="h-[2px] w-full bg-gradient-to-r from-green-600 via-white to-red-600" />

      <section className="bg-white px-5 py-14 sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
            <section className="min-w-0">
              <Link
                href={isAdminUser ? ROUTES.admin.root : ROUTES.public.home}
                className="group inline-flex max-w-full items-center gap-4"
              >
                <Image
                  src="/branding/ER-Democracy-Bologna-logo.png"
                  alt="ER Democracy Bologna"
                  width={84}
                  height={84}
                  className="h-16 w-16 shrink-0 object-contain transition duration-300 group-hover:scale-[1.03] sm:h-20 sm:w-20"
                />

                <div className="min-w-0">
                  <p className="break-words text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">
                    ER Democracy Bologna
                  </p>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    {isAdminUser
                      ? "Management area"
                      : "Civic participation platform"}
                  </p>
                </div>
              </Link>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600">
                {isAdminUser
                  ? "Manage consultations, review participation activity, and keep public information clear."
                  : "A clear place to browse public articles and consultations, understand the context, and participate when a process is open."}
              </p>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Contact
                </p>

                <a
                  href="mailto:admin@er-democracy-bologna.xyz"
                  className="mt-3 inline-flex break-all text-sm font-bold text-slate-950 transition duration-300 hover:text-green-700 active:text-green-700"
                >
                  admin@er-democracy-bologna.xyz
                </a>
              </div>
            </section>

            <FooterColumn title={isAdminUser ? "Management" : "Platform"}>
              {isAdminUser ? (
                <>
                  {visibleAdminNav.map((item) => (
                    <FooterLink key={item.href} href={item.href}>
                      {item.label}
                    </FooterLink>
                  ))}

                  <FooterLink href={ROUTES.user.assessment}>
                    My assessment
                  </FooterLink>

                  <FooterLink href={ROUTES.public.consultations}>
                    Public consultations
                  </FooterLink>
                </>
              ) : (
                <>
                  {PUBLIC_NAV.map((item) => (
                    <FooterLink key={item.href} href={item.href}>
                      {item.label}
                    </FooterLink>
                  ))}

                  {isAuthenticated ? (
                    <>
                      <FooterLink href={ROUTES.user.dashboard}>
                        Dashboard
                      </FooterLink>

                      <FooterLink href={ROUTES.user.assessment}>
                        Assessment
                      </FooterLink>
                    </>
                  ) : (
                    <>
                      <FooterLink href={ROUTES.public.login}>Login</FooterLink>

                      <FooterLink href={ROUTES.public.register}>
                        Sign up
                      </FooterLink>
                    </>
                  )}
                </>
              )}
            </FooterColumn>

            <FooterColumn title="Legal">
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href={ROUTES.public.terms}>Terms</FooterLink>
              <FooterLink href="/cookies">Cookies</FooterLink>
              <FooterLink href={ROUTES.public.contact}>Contact</FooterLink>
            </FooterColumn>
          </div>

          <div className="mt-12 grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <p>
              © {new Date().getFullYear()} ER Democracy Bologna. All rights
              reserved.
            </p>

            <p className="font-medium text-slate-500">
              Transparent civic participation.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full overflow-hidden bg-white" aria-hidden="true">
        <Image
          src="/footer.png"
          alt=""
          width={5444}
          height={1728}
          sizes="100vw"
          className="block h-auto w-full select-none"
          priority={false}
          unoptimized
        />
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-xs font-black uppercase tracking-[0.24em] text-green-700">
        {title}
      </h3>

      <div className="mt-5 grid gap-2">{children}</div>
    </section>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-11 items-center justify-between border-b border-slate-200 text-sm font-bold text-slate-700 transition duration-300 hover:border-green-600 hover:text-green-700 active:border-green-600 active:text-green-700"
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="text-lg font-black text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-green-700"
      >
        →
      </span>
    </Link>
  );
}
