import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [
      "http://localhost:3000",
      "https://www.travelkitchen.app",
      "https://travel-kitchen.vercel.app",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  },
});

export default http;
