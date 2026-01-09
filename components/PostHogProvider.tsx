"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,

        // Session Replay - records user sessions for playback
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },

        // Error/Exception tracking - auto-capture JS errors
        autocapture: true,
        capture_exceptions: true,

        // Performance - capture performance metrics
        capture_performance: true,
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <WebVitalsTracker />
      {children}
    </PHProvider>
  );
}

// Web Vitals tracking component
function WebVitalsTracker() {
  const posthogClient = usePostHog();

  useReportWebVitals((metric) => {
    posthogClient.capture("web_vitals", {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      metric_id: metric.id,
      metric_navigationType: metric.navigationType,
    });
  });

  return null;
}
