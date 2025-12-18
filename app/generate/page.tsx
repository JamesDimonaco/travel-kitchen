"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { ChefHat, ArrowLeft, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SingleRecipeForm from "./single-recipe-form";
import MultipleOptions from "./multiple-options";

export default function GeneratePage() {
  const { data: session, isPending: sessionPending } = useSession();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            <span className="font-semibold">Generate Recipe</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Single Recipe
            </TabsTrigger>
            <TabsTrigger value="multiple" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Multiple Options
              <Badge variant="secondary" className="ml-1 text-xs">
                New
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <SingleRecipeForm
              isAuthenticated={!!session}
              sessionPending={sessionPending}
            />
          </TabsContent>

          <TabsContent value="multiple">
            <MultipleOptions />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
