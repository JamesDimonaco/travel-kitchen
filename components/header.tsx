"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleSignOut, useSession } from "@/lib/auth-client";
import {
  Loader2,
  Menu,
  ChefHat,
  BookOpen,
  Globe,
  LogOut,
  LogIn,
  UserPlus,
  MoreVertical,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { track, resetUser, ANALYTICS_EVENTS } from "@/lib/analytics";

interface HeaderProps {
  title?: string;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function Header({ title, centerContent, rightContent }: HeaderProps) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [sheetOpen, setSheetOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  const handleSignOutClick = () => {
    track(ANALYTICS_EVENTS.USER_SIGNED_OUT);
    resetUser();
    handleSignOut();
    setSheetOpen(false);
  };

  const navItems = [
    { href: "/generate", label: "Generate Recipe", icon: ChefHat },
    { href: "/my-recipes", label: "My Recipes", icon: BookOpen },
    { href: "/marketplace", label: "Marketplace", icon: Globe },
  ];

  const ThemeToggleButton = () => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Traveler's Kitchen"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-semibold text-lg hidden sm:inline">
            Traveler&apos;s Kitchen
          </span>
        </Link>

        {/* Center - Custom content or page title (on inner pages) */}
        {centerContent ? (
          <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
            {centerContent}
          </div>
        ) : title && !isHome ? (
          <h1 className="font-semibold text-sm sm:text-base absolute left-1/2 -translate-x-1/2 hidden sm:block">
            {title}
          </h1>
        ) : null}

        {/* Right side - Navigation */}
        <div className="flex items-center gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : session ? (
            <>
              {/* Desktop: Show nav items on home, dropdown on other pages */}
              {isHome ? (
                <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button variant="ghost" size="sm">
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              ) : null}

              {/* Additional right content (e.g., New Recipe button) - before menu */}
              {rightContent}

              {/* Theme toggle - desktop */}
              <div className="hidden md:block">
                <ThemeToggleButton />
              </div>

              {/* Desktop: Sign out button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOutClick}
                className="hidden md:flex"
              >
                Sign Out
              </Button>

              {/* Desktop: Dropdown menu (on non-home pages) */}
              {!isHome && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="hidden md:flex">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Navigation menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {navItems.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile: Sheet menu */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Image
                        src="/logo.png"
                        alt="Traveler's Kitchen"
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                      Traveler&apos;s Kitchen
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                      >
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className="w-full justify-start gap-3"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    <div className="border-t my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <Sun className="h-4 w-4 dark:hidden" />
                      <Moon className="h-4 w-4 hidden dark:block" />
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOutClick}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              {/* Not signed in - theme toggle */}
              <div className="hidden sm:block">
                <ThemeToggleButton />
              </div>

              {/* Not signed in */}
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" className="hidden sm:block">
                <Button size="sm">Get Started</Button>
              </Link>

              {/* Mobile: Sheet for sign in/up */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild className="sm:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Image
                        src="/logo.png"
                        alt="Traveler's Kitchen"
                        width={24}
                        height={24}
                        className="h-6 w-6"
                      />
                      Traveler&apos;s Kitchen
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    <Link href="/sign-in" onClick={() => setSheetOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <LogIn className="h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setSheetOpen(false)}>
                      <Button className="w-full justify-start gap-3">
                        <UserPlus className="h-4 w-4" />
                        Get Started
                      </Button>
                    </Link>
                    <div className="border-t my-2" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <Sun className="h-4 w-4 dark:hidden" />
                      <Moon className="h-4 w-4 hidden dark:block" />
                      {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
