import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import { createMockSupabaseClient } from "./mock-supabase";

// Set environment variables for tests if not already loaded
process.env["SUPABASE_SERVICE_ROLE_KEY"] ||= "mock-service-role-key-test-environment";
process.env["SUPABASE_URL"] ||= "https://plyvtevuxdmzswtvpmwv.supabase.co";
process.env["VITE_SUPABASE_URL"] ||= "https://plyvtevuxdmzswtvpmwv.supabase.co";
process.env["SUPABASE_ANON_KEY"] ||= "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";
process.env["VITE_SUPABASE_ANON_KEY"] ||= "sb_publishable_RCZ5Bq_iBxEUsJqShVgk2g_jl2zPyRb";

// Mock @supabase/supabase-js to provide a fast, isolated in-memory client for automated testing
vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn((url: string, key: string, options?: any) => {
      return createMockSupabaseClient(url, key, options);
    }),
  };
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});
