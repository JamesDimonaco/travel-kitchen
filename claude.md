# Traveler's Kitchen

## Project Overview

Traveler's Kitchen is a web app for travelers cooking in limited kitchens (hostels, guesthouses, basic rentals). Users select what equipment they have (hob, microwave, kettle, etc.), optionally their country + dietary needs, and any ingredients they already have. The app generates a simple, realistic recipe that respects those constraints.

### Core User Flow
1. Select available equipment (hob, microwave, kettle, oven, rice cooker, etc.)
2. Optionally set country + dietary needs
3. Input ingredients they already have
4. Generate a constraint-respecting recipe
5. View formatted output: shopping list, prep group, step-by-step instructions
6. Save recipes, optionally publish to public marketplace
7. Use cooking mode while making the dish

## Tech Stack

- **Framework**: Next.js (App Router)
- **Package Manager**: pnpm
- **Backend**: Convex
- **Auth**: Better Auth
- **AI**: Next.js AI SDK
- **Validation**: Zod

## MVP Build Plan

### Phase 1: Convex Backend Foundation

#### 1.1 Create Convex project + connect to Next.js
- [x] Install Convex packages via `npm create convex@latest`
- [ ] Configure `convex/` folder
- [ ] Set up env vars

#### 1.2 Define Convex Schema
Tables:
- `users` - auth subject, profile basics
- `recipes` - private/published, inputs, output JSON, timestamps
- `recipeEvents` - saved/cooked/published etc. (optional for MVP)

#### 1.3 Server Functions: Recipes CRUD
Mutations/Queries:
- Create recipe record
- List "my recipes"
- Get recipe by id
- Publish/unpublish recipe
- List marketplace recipes (published)

### Phase 2: Auth (Better Auth) + User Identity

#### 2.1 Integrate Better Auth
- Configure Better Auth provider(s) (email/password or email magic link)
- Add session handling in Next.js

#### 2.2 Protect Routes
Require auth for:
- Generate page
- My recipes page
- Saving/publishing actions

#### 2.3 User Sync to Convex
- On first login, create/update `users` record in Convex with auth subject

### Phase 3: Core Recipe Generation Flow (AI)

#### 3.1 Build "Generate Recipe" Form (constraints-first)
Inputs:
- Equipment toggles (hob, microwave, kettle, oven, rice cooker, etc.)
- Dietary preferences/allergens (simple checkboxes)
- Country (optional text/select)
- Ingredients user has (chips + free text)
- Servings (optional) + max time (optional)

#### 3.2 Implement Generation API Route
Next.js route handler that:
- Validates input (zod)
- Creates a "generation request" prompt
- Calls model via Next.js AI SDK
- Enforces strict JSON schema output

#### 3.3 Output Validation + Retry
Validate response matches schema and constraints:
- No forbidden equipment steps
- Steps count within limit
- Ingredients reasonable
- If invalid, do one corrective retry

#### 3.4 Render Recipe Result Page
UI sections:
- Title + time + servings + equipment used
- Shopping list: "have / need / optional"
- Prep group
- Steps (short, numbered)
- Substitutions

### Phase 4: Save + Publish (Marketplace)

#### 4.1 Save Recipe
- On successful generation: store inputs + validated output JSON in Convex recipes
- Mark as private by default

#### 4.2 My Recipes Page
- List saved recipes (private + published badges)
- Actions: view, delete, publish/unpublish

#### 4.3 Marketplace Page
- Public list of published recipes
- Filters (MVP simple): equipment (multi-select), diet (optional), max time (optional)

#### 4.4 Recipe Detail Page (public/private)
- Show recipe from stored JSON
- If owner: show publish toggle
- If public: show "save to my recipes" (optional for MVP)

## Data Models

### Recipe Input Schema
```typescript
{
  equipment: string[]           // ['hob', 'kettle', 'microwave']
  dietaryPreferences: string[]  // ['vegetarian', 'gluten-free']
  allergens: string[]           // ['nuts', 'dairy']
  country?: string              // 'Thailand'
  ingredients: string[]         // ['rice', 'eggs', 'soy sauce']
  servings?: number             // 2
  maxTime?: number              // 30 (minutes)
}
```

### Recipe Output Schema
```typescript
{
  title: string
  description: string
  prepTime: number              // minutes
  cookTime: number              // minutes
  servings: number
  equipmentUsed: string[]
  shoppingList: {
    have: string[]
    need: string[]
    optional: string[]
  }
  prepGroup: {
    task: string
    ingredients: string[]
  }[]
  steps: {
    number: number
    instruction: string
    duration?: number           // minutes
    equipment?: string
  }[]
  substitutions: {
    original: string
    substitute: string
    note?: string
  }[]
  tips?: string[]
}
```

## Equipment Options
- Hob/Stovetop
- Microwave
- Kettle
- Oven
- Rice Cooker
- Toaster
- Mini Fridge (for cold prep)
- Basic Utensils Only (knife, cutting board, bowl)

## Dietary Options
- Vegetarian
- Vegan
- Gluten-Free
- Dairy-Free
- Nut-Free
- Halal
- Kosher
- Low-Carb

## Notes
- MVP focuses on reliable constraint-based generation, saving/publishing, and basic analytics
- Payments/credits come later
- Cooking mode is a nice-to-have for MVP
