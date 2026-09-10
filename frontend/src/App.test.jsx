import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
    googleLoginUrl: "/api/auth/google",
    facebookLoginUrl: "/api/auth/facebook",
    adminStats: vi.fn(),
    getAdLevel: vi.fn().mockResolvedValue({ data: { level: 0 } }),
    setAdLevel: vi.fn(),
  },
}));

const USER = { id: 1, name: "Sita Devi", email: "sita@example.com", avatar_url: null };

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("lets an anonymous visitor start chatting immediately as a guest", async () => {
    api.me.mockResolvedValueOnce({ data: { user: null } });
    api.history.mockResolvedValueOnce({
      data: { messages: [], guest: { remaining: 5, limit: 5 } },
    });
    render(<App />);

    // No login wall — straight into the landing/chat screen.
    expect(await screen.findByTestId("landingGreeting")).toBeInTheDocument();
    expect(screen.queryByTestId("authSubmit")).not.toBeInTheDocument();
    expect(screen.getByTestId("guestCounterTopbar")).toHaveTextContent("5/5 free");
  });

  it("shows the landing screen with suggestion chips once authenticated", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });
    render(<App />);

    expect(await screen.findByTestId("landingGreeting")).toBeInTheDocument();
    expect(screen.getByText(/who is hanuman/i)).toBeInTheDocument();
    expect(screen.getByText(USER.email)).toBeInTheDocument();
  });

  it("restores prior chat history from the server instead of starting blank", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({
      data: {
        messages: [
          { role: "user", content: "Who is Hanuman?", sources: [], ts: "2026-01-01T00:00:00" },
          {
            role: "assistant",
            content: "Hanuman is a devoted vanara.",
            sources: [{ source_file: "ramayana.pdf", page: 5, relevance: 0.91 }],
            ts: "2026-01-01T00:00:01",
          },
        ],
      },
    });
    render(<App />);

    expect(await screen.findByText("Who is Hanuman?")).toBeInTheDocument();
    expect(screen.getByText(/hanuman is a devoted vanara/i)).toBeInTheDocument();
    expect(screen.getByText(/91% match/)).toBeInTheDocument();
  });

  it("sends a suggestion chip prompt and renders the grounded answer", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });
    api.chat.mockResolvedValueOnce({
      data: {
        answer: "Hanuman is Rama's devoted companion.",
        sources: [{ source_file: "ramayana.pdf", page: 3, relevance: 0.8 }],
      },
    });

    const user = userEvent.setup();
    render(<App />);

    const chip = await screen.findByText(/who is hanuman/i);
    await user.click(chip.closest("button"));

    expect(api.chat).toHaveBeenCalledWith(expect.stringMatching(/who is hanuman/i));
    expect(await screen.findByText(/hanuman is rama's devoted companion/i)).toBeInTheDocument();
  });

  it("logs out and returns to guest mode rather than a forced login wall", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [], guest: null } });
    api.logout.mockResolvedValueOnce({});
    api.history.mockResolvedValueOnce({
      data: { messages: [], guest: { remaining: 5, limit: 5 } },
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("landingGreeting");
    await user.click(screen.getByTitle(/log out/i));

    expect(api.logout).toHaveBeenCalled();
    expect(await screen.findByTestId("landingGreeting")).toBeInTheDocument();
    expect(screen.getByText(/log in \/ sign up/i)).toBeInTheDocument();
  });

  it("toggles the theme attribute on the document root", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("landingGreeting");
    const toggle = screen.getByText(/dark mode|light mode/i);
    await user.click(toggle);

    expect(document.documentElement.getAttribute("data-theme")).toMatch(/light|dark/);
    expect(localStorage.getItem("ramayana_helpbot_theme")).toMatch(/light|dark/);
  });

  it("persists the background-intensity slider value", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });
    render(<App />);

    await screen.findByTestId("landingGreeting");
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "0.2" } });

    await waitFor(() => expect(localStorage.getItem("ramayana_helpbot_veil")).toBe("0.2"));
  });

  it("opens the Sanskrit shloka library from the sidebar and asks the chatbot from a card", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });
    api.chat.mockResolvedValueOnce({
      data: { answer: "This verse teaches humble service.", sources: [] },
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("landingGreeting");
    await user.click(screen.getByText(/sanskrit shlokas/i));

    expect(await screen.findByText("Sanskrit Shloka Library")).toBeInTheDocument();

    await user.click(screen.getAllByText(/ask about this/i)[0]);

    // The library closes and the question reaches the chatbot.
    expect(screen.queryByText("Sanskrit Shloka Library")).not.toBeInTheDocument();
    expect(api.chat).toHaveBeenCalledWith(expect.stringContaining("shloka"));
    expect(await screen.findByText(/this verse teaches humble service/i)).toBeInTheDocument();
  });

  it("opens the Prompt Library from the sidebar and asks the chatbot from a card", async () => {
    api.me.mockResolvedValueOnce({ data: { user: USER } });
    api.history.mockResolvedValueOnce({ data: { messages: [] } });
    api.chat.mockResolvedValueOnce({
      data: { answer: "Hanuman's devotion teaches selfless service.", sources: [] },
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByTestId("landingGreeting");
    await user.click(screen.getByText(/prompt library/i));

    // "Prompt Library" (and "Who is Hanuman") also appear behind the modal —
    // scope everything to the modal panel to avoid ambiguity.
    const panel = await screen.findByText("A fuller set of questions to explore the Ramayana and its connected Puranas.");
    const { getByText } = within(panel.closest(".promptPanel"));
    expect(getByText("Prompt Library")).toBeInTheDocument();

    await user.click(getByText(/who is hanuman/i));

    expect(document.querySelector(".promptPanel")).not.toBeInTheDocument();
    expect(api.chat).toHaveBeenCalledWith(expect.stringContaining("Hanuman"));
    expect(await screen.findByText(/hanuman's devotion teaches selfless service/i)).toBeInTheDocument();
  });
});
