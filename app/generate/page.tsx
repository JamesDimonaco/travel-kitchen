"use client";

import { useSession } from "@/lib/auth-client";
import { ChefHat, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import SingleRecipeForm from "./single-recipe-form";
import MultipleOptions from "./multiple-options";
import { Header } from "@/components/header";

export default function GeneratePage() {
  const { data: session, isPending: sessionPending } = useSession();

  return (
    <div className="min-h-screen bg-muted/30">
      <Header title="Generate Recipe" />

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
