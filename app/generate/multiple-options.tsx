"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Trash2, RefreshCw } from "lucide-react";
import RecipeIdeasForm, { type IdeasFormData } from "./recipe-ideas-form";
import RecipeIdeaCard, { type RecipeIdea } from "./recipe-idea-card";
import RecipeIdeaDialog from "./recipe-idea-dialog";
import type { Id } from "@/convex/_generated/dataModel";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

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
  const [sessionId, setSessionId] = useState<Id<"recipeIdeaSessions"> | null>(null);
  const [sessionInputs, setSessionInputs] = useState<IdeasFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [moreContext, setMoreContext] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<RecipeIdea | null>(null);
  const [expandingIdeaId, setExpandingIdeaId] = useState<Id<"recipeIdeas"> | null>(null);

  // Queries
  const activeSession = useQuery(api.recipeIdeas.getActiveSession);
  const sessionIdeas = useQuery(
    api.recipeIdeas.getSessionIdeas,
    sessionId ? { sessionId } : "skip"
  );

  // Mutations
  const createSession = useMutation(api.recipeIdeas.createSession);
  const addIdeas = useMutation(api.recipeIdeas.addIdeas);
  const clearSession = useMutation(api.recipeIdeas.clearSession);

  // Load active session on mount
  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession._id);
      setSessionInputs(activeSession.inputs as IdeasFormData);
    }
  }, [activeSession]);

  const handleGenerate = async (data: IdeasFormData) => {
    setIsGenerating(true);
    try {
      // Create new session
      const newSessionId = await createSession({ inputs: data });
      setSessionId(newSessionId);
      setSessionInputs(data);

      // Generate ideas
      const response = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    setIsGeneratingMore(true);
    try {
      const existingTitles = sessionIdeas?.map((idea) => idea.title) || [];

      const response = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleRecipeGenerated = (ideaId: Id<"recipeIdeas">, fullRecipe: FullRecipe) => {
    // Update local state so the card shows "View Full Recipe"
    setExpandingIdeaId(null);
  };

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
        sessionInputs={sessionInputs}
        onClose={() => setSelectedIdea(null)}
        onRecipeGenerated={handleRecipeGenerated}
      />
    </div>
  );
}
