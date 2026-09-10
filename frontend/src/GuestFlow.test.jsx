import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import api from "./api";

vi.mock("./api", () => ({
  default: {
    me: vi.fn(),
    history: vi.fn(),
    chat: vi.fn(),
    clearChat: vi.fn(),
    ingest: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    googleLoginUrl: "/api/auth/google",
    facebookLoginUrl: "/api/auth/facebook",
    adminStats: vi.fn(),
    getAdLevel: vi.fn().mockResolvedValue({ data: { level: 0 } }),
    setAdLevel: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("Guest flow", () => {
  it("shows the remaining-questions counter and decrements it after a guest message", async () => {
    api.me.mockResolvedValueOnce({ data: { user: null } });
    api.history.mockResolvedValueOnce({
      data: { messages: [], guest: { remaining: 10, limit: 10 } },
    });
    api.chat.mockResolvedValueOnce({
      data: {
        answer: "Hanuman is Rama's devoted companion.",
        sources: [],
        guest: { remaining: 9, limit: 10 },
      },
    });

    const user = userEvent.setup();
    render(<App />);

    const chip = await screen.findByText(/who is hanuman/i);
    await user.click(chip.closest("button"));

    expect(await screen.findByText(/hanuman is rama's devoted companion/i)).toBeInTheDocument();
    expect(await screen.findByTestId("guestCounterTopbar")).toHaveTextContent("9/10 free");
  });

  it("gates into the auth screen once the guest exhausts all 10 questions, without losing the transcript", async () => {
    api.me.mockResolvedValueOnce({ data: { user: null } });
    api.history.mockResolvedValueOnce({
      data: {
        messages: [
          { role: "user", content: "Earlier question", sources: [], ts: "2026-01-01T00:00:00" },
          { role: "assistant", content: "Earlier answer.", sources: [], ts: "2026-01-01T00:00:01" },
        ],
        guest: { remaining: 0, limit: 10 },
      },
    });
    api.chat.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          error: "guest_limit_reached",
          message: "You've used all 10 free questions as a guest.",
          guest: { remaining: 0, limit: 10 },
        },
      },
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Earlier question");

    const input = screen.getByPlaceholderText(/ask about rama/i);
    await user.type(input, "One more question");
    const sendBtn = screen.getByTitle("Send");
    await user.click(sendBtn);

    expect(await screen.findByText(/used all 10 free questions/i)).toBeInTheDocument();
    // The gate is the full-screen AuthScreen — a real sign-in path, not a dead end.
    expect(screen.getByTestId("authSubmit")).toBeInTheDocument();
  });

  it("lets a guest voluntarily sign in before hitting the limit, and cancel back to guest chat", async () => {
    api.me.mockResolvedValueOnce({ data: { user: null } });
    api.history.mockResolvedValueOnce({
      data: { messages: [], guest: { remaining: 7, limit: 10 } },
    });

    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByText(/log in \/ sign up/i));
    expect(await screen.findByTestId("authSubmit")).toBeInTheDocument();

    await user.click(screen.getByText(/continue as guest/i));
    expect(await screen.findByTestId("landingGreeting")).toBeInTheDocument();
  });

  it("resumes as the authenticated user after signing in from the gate, via fresh server history", async () => {
    api.me.mockResolvedValueOnce({ data: { user: null } });
    api.history.mockResolvedValueOnce({
      data: { messages: [], guest: { remaining: 0, limit: 10 } },
    });
    api.chat.mockRejectedValueOnce({
      response: { status: 403, data: { error: "guest_limit_reached", guest: { remaining: 0, limit: 10 } } },
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("landingGreeting");
    const chip = await screen.findByText(/who is hanuman/i);
    await user.click(chip.closest("button"));
    await screen.findByTestId("authSubmit");

    // Signing in claims the guest session server-side; the frontend just
    // re-fetches history as the now-authenticated user.
    api.login.mockResolvedValueOnce({
      data: { user: { id: 1, name: "Sita Devi", email: "sita@example.com" } },
    });
    api.history.mockResolvedValueOnce({
      data: {
        messages: [
          { role: "user", content: "Who is Hanuman, and what does his devotion to Rama teach us?", sources: [], ts: "2026-01-01T00:00:00" },
        ],
        guest: null,
      },
    });

    // Gated screen defaults to the signup tab — switch to login for a returning user.
    await user.click(screen.getByText(/log in instead/i));
    await user.type(screen.getByPlaceholderText(/^email$/i), "sita@example.com");
    await user.type(screen.getByPlaceholderText(/^password$/i), "supersecret1");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.submit(screen.getByPlaceholderText(/^password$/i).closest("form"));

    // Chat has a message now, so it's the transcript view, not the landing
    // greeting — assert on the now-authenticated sidebar identity and the
    // claimed guest message both being present together.
    expect(await screen.findByText("Sita Devi")).toBeInTheDocument();
    expect(screen.getByText(/who is hanuman, and what does his devotion/i)).toBeInTheDocument();
  });
});
