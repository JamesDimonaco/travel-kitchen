"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Send,
  Loader2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  User,
  Bot,
} from "lucide-react";
import type { RecipeResponse, RecipeFormData } from "@/lib/recipe-schema";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RecipeChatProps {
  recipe: RecipeResponse;
  inputs: RecipeFormData;
  onRecipeUpdate: (newRecipe: RecipeResponse) => void;
  onUpdatingStart?: () => void;
}

export default function RecipeChat({
  recipe,
  inputs,
  onRecipeUpdate,
  onUpdatingStart,
}: RecipeChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/recipe-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          recipe,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = (Date.now() + 1).toString();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Update the assistant message with streamed content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the last assistant message suggests an update
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const showUpdateButton =
    lastAssistantMessage?.content.includes("[RECIPE_UPDATE_AVAILABLE]") &&
    !isUpdating &&
    !isLoading;

  const handleUpdateRecipe = async () => {
    setIsUpdating(true);
    onUpdatingStart?.();
    try {
      const response = await fetch("/api/ai/update-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content.replace("[RECIPE_UPDATE_AVAILABLE]", "").trim(),
          })),
          recipe,
          inputs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe");
      }

      const data = await response.json();
      onRecipeUpdate(data.recipe);
    } catch (error) {
      console.error("Failed to update recipe:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Clean message content for display (remove the marker)
  const cleanContent = (content: string) =>
    content.replace("[RECIPE_UPDATE_AVAILABLE]", "").trim();

  return (
    <div className="bg-background rounded-lg border overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Chat about this recipe</span>
          {messages.length > 0 && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable chat section */}
      {isExpanded && (
        <div className="border-t">
          {/* Messages area */}
          <div className="max-h-80 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>Ask questions or request changes to your recipe.</p>
                <p className="mt-1 text-xs">
                  Try: &quot;Can I add eggs?&quot; or &quot;What if I don&apos;t have
                  garlic?&quot;
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {cleanContent(message.content) || (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Update recipe button */}
          {showUpdateButton && (
            <div className="px-4 pb-3">
              <Button
                onClick={handleUpdateRecipe}
                disabled={isUpdating}
                className="w-full"
                variant="secondary"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating recipe...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Recipe with Changes
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or request a change..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
