"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-[#E3E6EA] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="https://i.ibb.co/twFGcGyH/Linz-Hub-Coloured-Logo.png"
            alt="Young AI Leaders"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            unoptimized
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className={`font-inter text-sm font-medium transition-colors hidden sm:block ${
              pathname === "/"
                ? "text-[#1A1A1A]"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            Events
          </Link>
          <Link
            href="/kontakt"
            className={`font-poppins text-sm font-semibold px-4 py-2 rounded-cta transition-opacity ${
              pathname === "/kontakt"
                ? "bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] opacity-80"
                : "bg-gradient-to-br from-[#A3C4F3] to-[#B8E0D2] text-[#1A1A1A] hover:opacity-90"
            }`}
          >
            Event einreichen
          </Link>
        </nav>
      </div>
    </header>
  );
}
