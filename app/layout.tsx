import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { getToken } from "@/lib/auth-server";
import { Toaster } from "sonner";
import {
  OrganizationSchema,
  WebsiteSchema,
} from "@/components/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.travelkitchen.app";
const SITE_NAME = "Traveler's Kitchen";
const SITE_DESCRIPTION =
  "Generate simple, realistic recipes for travelers cooking with limited equipment. Perfect for hostels, Airbnbs, and basic rental kitchens. Cook anywhere with whatever you've got.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Simple Recipes for Travelers`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "travel recipes",
    "hostel cooking",
    "backpacker recipes",
    "simple recipes",
    "limited kitchen",
    "one pot meals",
    "easy cooking",
    "travel food",
    "budget cooking",
    "hostel kitchen",
    "airbnb cooking",
    "minimal equipment cooking",
    "kettle recipes",
    "microwave recipes",
    "stovetop recipes",
    "traveler meals",
    "quick recipes",
    "basic kitchen recipes",
    "cooking abroad",
    "nomad cooking",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Simple Recipes for Travelers`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/travelers-kitchen-hostel-cooking.jpg",
        width: 1200,
        height: 800,
        alt: "Travelers cooking together in a hostel kitchen - Traveler's Kitchen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Simple Recipes for Travelers`,
    description: SITE_DESCRIPTION,
    images: ["/travelers-kitchen-hostel-cooking.jpg"],
    creator: "@travelkitchen",
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "Food & Drink",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <ConvexClientProvider initialToken={token}>
              {children}
            </ConvexClientProvider>
          </PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
