"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { handleSignOut, useSession } from "@/lib/auth-client";
import { ChefHat, UtensilsCrossed, Globe, Clock, Loader2 } from "lucide-react";
import { track, resetUser, ANALYTICS_EVENTS } from "@/lib/analytics";
import { FAQSchema } from "@/components/seo/structured-data";

const faqs = [
  {
    question: "What equipment do I need to use Traveler's Kitchen?",
    answer:
      "Traveler's Kitchen works with whatever you have! Whether it's just a kettle, a microwave, a stovetop, or a full kitchen, our AI generates recipes that work with your available equipment.",
  },
  {
    question: "Can I cook real meals in a hostel kitchen?",
    answer:
      "Absolutely! Our recipes are specifically designed for limited kitchens like hostels, Airbnbs, and guesthouses. We focus on simple techniques and commonly available ingredients.",
  },
  {
    question: "How does the recipe generator work?",
    answer:
      "Simply tell us what equipment you have, any dietary requirements, and what ingredients you'd like to use. Our AI will generate a complete recipe with shopping list, prep instructions, and step-by-step cooking guide.",
  },
  {
    question: "Are the recipes suitable for beginners?",
    answer:
      "Yes! All recipes are designed to be simple and straightforward with clear instructions. No fancy techniques required - just good food that anyone can make.",
  },
  {
    question: "Can I save and share my recipes?",
    answer:
      "Yes! Create a free account to save your favorite recipes, publish them to the community marketplace, and access them from anywhere during your travels.",
  },
];

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <>
      <FAQSchema faqs={faqs} />
      <div className="min-h-screen flex flex-col">
        <Header session={session} isPending={isPending} />
        <main className="flex-1">
          <HeroSection isLoggedIn={!!session} />
          <FeaturesSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  track(ANALYTICS_EVENTS.USER_SIGNED_OUT);
                  resetUser();
                  handleSignOut();
                }}
              >
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
        <div className="flex gap-4 justify-center mb-12">
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

        <div className="relative max-w-4xl mx-auto">
          <div className="rounded-xl overflow-hidden shadow-2xl border">
            <Image
              src="/travelers-kitchen-hostel-cooking.jpg"
              alt="Travelers cooking together in a hostel kitchen"
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>
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

function FAQSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-6 last:border-0">
              <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
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
