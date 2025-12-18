"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import { ChefHat, UtensilsCrossed, Globe, Clock, Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} isPending={isPending} />
      <main className="flex-1">
        <HeroSection isLoggedIn={!!session} />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}

function Header({
  session,
  isPending,
}: {
  session: unknown;
  isPending: boolean;
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          <span className="font-semibold text-lg">Traveler&apos;s Kitchen</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : session ? (
            <>
              <Link href="/generate">
                <Button variant="ghost" size="sm">
                  Generate Recipe
                </Button>
              </Link>
              <Link href="/my-recipes">
                <Button variant="ghost" size="sm">
                  My Recipes
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  Marketplace
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Cook anywhere with
          <br />
          <span className="text-primary">whatever you&apos;ve got</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Generate simple, realistic recipes based on your available equipment.
          Perfect for hostels, guesthouses, and basic rental kitchens.
        </p>
        <div className="flex gap-4 justify-center">
          {isLoggedIn ? (
            <Link href="/generate">
              <Button size="lg" className="gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Generate a Recipe
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline">
                  Browse Recipes
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: UtensilsCrossed,
      title: "Equipment-Based",
      description:
        "Tell us what you have - hob, microwave, kettle, or just a knife. We'll work with it.",
    },
    {
      icon: Globe,
      title: "Travel-Friendly",
      description:
        "Recipes designed for travelers cooking in unfamiliar kitchens with limited tools.",
    },
    {
      icon: Clock,
      title: "Quick & Simple",
      description:
        "Short, clear instructions. No fancy techniques. Just good food, fast.",
    },
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-background rounded-lg p-6 shadow-sm border"
            >
              <feature.icon className="h-10 w-10 mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>Traveler&apos;s Kitchen - Cook anywhere, with anything.</p>
      </div>
    </footer>
  );
}
