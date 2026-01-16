"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Trash2, Lock } from "lucide-react";
import RecipeIdeasForm, { type IdeasFormData } from "./recipe-ideas-form";
import RecipeIdeaCard, { type RecipeIdea } from "./recipe-idea-card";
import RecipeIdeaDialog from "./recipe-idea-dialog";
import type { Id } from "@/convex/_generated/dataModel";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { getAuthCookie, useSession } from "@/lib/auth-client";

interface FullRecipe {
  shopping: {
    have: string[];
    need: string[];
    optional: string[];
  };
  prepGroup: string[];
  steps: {
    title: string;
    detail: string;
    time_minutes: number;
  }[];
  substitutions: {
    ingredient: string;
    swap_options: string[];
  }[];
  tips: string[];
}

export default function MultipleOptions() {
  const { data: session, isPending: sessionPending } = useSession();
  const [sessionId, setSessionId] = useState<Id<"recipeIdeaSessions"> | null>(null);
  const [sessionInputs, setSessionInputs] = useState<IdeasFormData | null>(null);
  const [fullRecipesGenerated, setFullRecipesGenerated] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [moreContext, setMoreContext] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<RecipeIdea | null>(null);
  const [expandingIdeaId, setExpandingIdeaId] = useState<Id<"recipeIdeas"> | null>(null);

  const isAuthenticated = !!session;

  // Queries
  const activeSession = useQuery(api.recipeIdeas.getActiveSession);
  const sessionIdeas = useQuery(
    api.recipeIdeas.getSessionIdeas,
    sessionId ? { sessionId } : "skip"
  );
  const usageCheck = useQuery(api.usage.getMyUsage);

  // Mutations
  const createSession = useMutation(api.recipeIdeas.createSession);
  const addIdeas = useMutation(api.recipeIdeas.addIdeas);
  const clearSession = useMutation(api.recipeIdeas.clearSession);
  const recordGeneration = useMutation(api.usage.recordGeneration);

  // Load active session on mount
  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession._id);
      setSessionInputs(activeSession.inputs as IdeasFormData);
      setFullRecipesGenerated(activeSession.fullRecipesGenerated || 0);
    }
  }, [activeSession]);

  const handleGenerate = async (data: IdeasFormData) => {
    // Block if usage check hasn't loaded yet
    if (!usageCheck) {
      toast.error("Please wait while we check your available credits...");
      return;
    }

    // Check if user has credits
    if (usageCheck.aiGenerationsRemaining <= 0) {
      toast.error("You've used all your AI generations. Purchase more credits to continue.");
      return;
    }

    setIsGenerating(true);
    try {
      // Create new session
      const newSessionId = await createSession({ inputs: data });
      setSessionId(newSessionId);
      setSessionInputs(data);

      // Generate ideas
      const response = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Better-Auth-Cookie": getAuthCookie(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate ideas");
      }

      const { ideas } = await response.json();

      // Save ideas to database
      await addIdeas({
        sessionId: newSessionId,
        ideas,
      });

      // Record usage after successful generation - rethrow if fails to enforce limits
      await recordGeneration();

      track(ANALYTICS_EVENTS.IDEAS_GENERATED, { count: ideas.length });
      toast.success(`Generated ${ideas.length} recipe ideas!`);
    } catch (error) {
      track(ANALYTICS_EVENTS.IDEAS_GENERATION_FAILED);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate ideas"
      );
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!sessionId || !sessionInputs) return;

    // Block if usage check hasn't loaded yet
    if (!usageCheck) {
      toast.error("Please wait while we check your available credits...");
      return;
    }

    // Check if user has credits
    if (usageCheck.aiGenerationsRemaining <= 0) {
      toast.error("You've used all your AI generations. Purchase more credits to continue.");
      return;
    }

    setIsGeneratingMore(true);
    try {
      const existingTitles = sessionIdeas?.map((idea) => idea.title) || [];

      const response = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Better-Auth-Cookie": getAuthCookie(),
        },
        body: JSON.stringify({
          ...sessionInputs,
          context: moreContext || undefined,
          existingTitles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate ideas");
      }

      const { ideas } = await response.json();

      // Save ideas to database
      await addIdeas({
        sessionId,
        ideas,
      });

      // Record usage after successful generation - rethrow if fails to enforce limits
      await recordGeneration();

      setMoreContext("");
      track(ANALYTICS_EVENTS.MORE_IDEAS_REQUESTED, { count: ideas.length });
      toast.success(`Generated ${ideas.length} more ideas!`);
    } catch (error) {
      track(ANALYTICS_EVENTS.IDEAS_GENERATION_FAILED);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate ideas"
      );
      console.error(error);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleClearSession = async () => {
    if (!sessionId) return;

    try {
      await clearSession({ sessionId });
      setSessionId(null);
      setSessionInputs(null);
      track(ANALYTICS_EVENTS.IDEA_SESSION_CLEARED);
      toast.success("Session cleared");
    } catch (error) {
      toast.error("Failed to clear session");
      console.error(error);
    }
  };

  const handleSelectIdea = (idea: RecipeIdea) => {
    setSelectedIdea(idea);
  };

  const handleRecipeGenerated = (ideaId: Id<"recipeIdeas">, fullRecipe: FullRecipe, newCount: number) => {
    // Update the local count from the database response
    setFullRecipesGenerated(newCount);
    setExpandingIdeaId(null);
  };

  // Show loading state
  if (sessionPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show sign-up prompt for anonymous users
  if (!isAuthenticated) {
    return (
      <div className="bg-background rounded-lg border p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Explore Multiple Recipe Ideas</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Sign up to explore multiple recipe ideas at once! Enter your ingredients and constraints,
          and we&apos;ll generate several recipe options for you to choose from.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/sign-up">
            <Button size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Sign Up to Explore Ideas
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="lg">
              Already have an account? Sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show form if no active session with ideas
  if (!sessionId || !sessionIdeas || sessionIdeas.length === 0) {
    return (
      <RecipeIdeasForm onGenerate={handleGenerate} isGenerating={isGenerating} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="bg-background rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Your Recipe Ideas</h2>
            <p className="text-sm text-muted-foreground">
              {sessionIdeas.length} ideas generated
              {sessionInputs?.baseIngredient && (
                <> • Base: {sessionInputs.baseIngredient}</>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSession}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Ideas grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sessionIdeas.map((idea) => (
          <RecipeIdeaCard
            key={idea._id}
            idea={idea as RecipeIdea}
            onSelect={handleSelectIdea}
            isExpanding={expandingIdeaId === idea._id}
          />
        ))}
      </div>

      {/* Generate more section */}
      <div className="bg-background rounded-lg border p-6">
        <h3 className="font-semibold mb-2">Want more ideas?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add context for different ideas (e.g., &quot;something spicy&quot;, &quot;more
          vegetarian options&quot;, &quot;Asian cuisine&quot;)
        </p>
        <div className="flex gap-3">
          <Textarea
            value={moreContext}
            onChange={(e) => setMoreContext(e.target.value)}
            placeholder="Optional: describe what kind of recipes you'd like..."
            className="min-h-[80px]"
          />
        </div>
        <Button
          onClick={handleGenerateMore}
          disabled={isGeneratingMore}
          className="mt-3"
        >
          {isGeneratingMore ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate More Ideas
            </>
          )}
        </Button>
      </div>

      {/* Recipe dialog */}
      <RecipeIdeaDialog
        idea={selectedIdea}
        sessionId={sessionId}
        sessionInputs={sessionInputs}
        onClose={() => setSelectedIdea(null)}
        onRecipeGenerated={handleRecipeGenerated}
        fullRecipesGenerated={fullRecipesGenerated}
      />
    </div>
  );
}
