import Script from "next/script";

const SITE_URL = "https://www.travelkitchen.app";
const SITE_NAME = "Traveler's Kitchen";

interface OrganizationSchemaProps {
  // No props needed, uses constants
}

export function OrganizationSchema({}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description:
      "Generate simple, realistic recipes for travelers cooking with limited equipment.",
    sameAs: [],
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebsiteSchemaProps {
  // No props needed, uses constants
}

export function WebsiteSchema({}: WebsiteSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Generate simple, realistic recipes for travelers cooking with limited equipment. Perfect for hostels, Airbnbs, and basic rental kitchens.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/marketplace?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface RecipeSchemaProps {
  recipe: {
    title: string;
    description: string;
    cookTime: number;
    prepTime?: number;
    servings: number;
    equipmentUsed: string[];
    shoppingList: {
      have: string[];
      need: string[];
      optional: string[];
    };
    steps: {
      number: number;
      instruction: string;
      duration?: number;
    }[];
    tips?: string[];
  };
  recipeId: string;
}

export function RecipeSchema({ recipe, recipeId }: RecipeSchemaProps) {
  const allIngredients = [
    ...recipe.shoppingList.have,
    ...recipe.shoppingList.need,
    ...recipe.shoppingList.optional,
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    url: `${SITE_URL}/recipe/${recipeId}`,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    datePublished: new Date().toISOString(),
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    cookTime: `PT${recipe.cookTime}M`,
    totalTime: `PT${(recipe.prepTime || 0) + recipe.cookTime}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: "Main Course",
    recipeCuisine: "International",
    keywords: [
      "travel recipe",
      "hostel cooking",
      "simple recipe",
      "limited kitchen",
      ...recipe.equipmentUsed,
    ].join(", "),
    recipeIngredient: allIngredients,
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.number,
      text: step.instruction,
    })),
    tool: recipe.equipmentUsed.map((tool) => ({
      "@type": "HowToTool",
      name: tool,
    })),
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: `${recipe.servings} servings`,
    },
  };

  return (
    <Script
      id={`recipe-schema-${recipeId}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbSchemaProps {
  items: {
    name: string;
    url: string;
  }[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQSchemaProps {
  faqs: {
    question: string;
    answer: string;
  }[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  itemCount: number;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  itemCount,
}: CollectionPageSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemCount,
    },
  };

  return (
    <Script
      id="collection-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
