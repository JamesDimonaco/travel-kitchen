"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Clock, Users, ChefHat, Utensils, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export interface RecipeIdea {
  _id: Id<"recipeIdeas">;
  title: string;
  description: string;
  keyIngredients: string[];
  estimatedTime: number;
  servings: number;
  equipmentNeeded: string[];
  dietaryTags: string[];
  difficulty: string;
  fullRecipe?: unknown;
}

interface RecipeIdeaCardProps {
  idea: RecipeIdea;
  onSelect: (idea: RecipeIdea) => void;
  isExpanding?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function RecipeIdeaCard({
  idea,
  onSelect,
  isExpanding,
}: RecipeIdeaCardProps) {
  const hasFullRecipe = !!idea.fullRecipe;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight">{idea.title}</h3>
          <Badge
            variant="secondary"
            className={difficultyColors[idea.difficulty] || ""}
          >
            {idea.difficulty}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {idea.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Quick stats */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{idea.estimatedTime} min</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{idea.servings}</span>
          </div>
        </div>

        {/* Equipment */}
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <ChefHat className="h-3 w-3" />
            <span>Equipment</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {idea.equipmentNeeded.map((eq) => (
              <Badge key={eq} variant="outline" className="text-xs">
                {eq}
              </Badge>
            ))}
          </div>
        </div>

        {/* Key ingredients */}
        <div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Utensils className="h-3 w-3" />
            <span>Key ingredients</span>
          </div>
          <p className="text-sm">
            {idea.keyIngredients.slice(0, 5).join(", ")}
            {idea.keyIngredients.length > 5 && (
              <span className="text-muted-foreground">
                {" "}
                +{idea.keyIngredients.length - 5} more
              </span>
            )}
          </p>
        </div>

        {/* Dietary tags */}
        {idea.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.dietaryTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-primary/10 text-primary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          onClick={() => onSelect(idea)}
          disabled={isExpanding}
          className="w-full"
          variant={hasFullRecipe ? "secondary" : "default"}
        >
          {isExpanding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : hasFullRecipe ? (
            "View Full Recipe"
          ) : (
            "Generate Full Recipe"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
