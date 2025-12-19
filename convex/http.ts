import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [
      "http://localhost:3000",
      "https://www.travelkitchen.app",
      "https://travel-kitchen.vercel.app",
      "https://confident-antelope-61.convex.site",
      "https://qualified-marlin-288.convex.site",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  },
});

export default http;
