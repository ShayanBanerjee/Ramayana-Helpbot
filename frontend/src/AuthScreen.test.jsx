import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthScreen from "./AuthScreen";
import api from "./api";

vi.mock("./api", () => ({
  default: {
    signup: vi.fn(),
    login: vi.fn(),
    googleLoginUrl: "/api/auth/google",
    facebookLoginUrl: "/api/auth/facebook",
  },
}));

describe("AuthScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form by default", () => {
    render(<AuthScreen onAuthed={vi.fn()} />);
    expect(screen.getByTestId("authSubmit")).toHaveTextContent(/^log in$/i);
    expect(screen.queryByPlaceholderText(/full name/i)).not.toBeInTheDocument();
  });

  it("switches to signup mode and shows the name field", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuthed={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuthed={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/^email$/i), "not-an-email");
    await user.type(screen.getByPlaceholderText(/^password$/i), "supersecret");
    fireEvent.submit(screen.getByPlaceholderText(/^password$/i).closest("form"));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it("shows a validation error for a short password", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuthed={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/^email$/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/^password$/i), "short");
    fireEvent.submit(screen.getByPlaceholderText(/^password$/i).closest("form"));

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it("submits valid login credentials and calls onAuthed", async () => {
    const onAuthed = vi.fn();
    api.login.mockResolvedValueOnce({ data: { user: { id: 1, name: "Test User", email: "user@example.com" } } });

    const user = userEvent.setup();
    render(<AuthScreen onAuthed={onAuthed} />);

    await user.type(screen.getByPlaceholderText(/^email$/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/^password$/i), "supersecret");
    fireEvent.submit(screen.getByPlaceholderText(/^password$/i).closest("form"));

    await waitFor(() => expect(api.login).toHaveBeenCalledWith("user@example.com", "supersecret"));
    await waitFor(() => expect(onAuthed).toHaveBeenCalledWith({ id: 1, name: "Test User", email: "user@example.com" }));
  });

  it("shows the server error message when login fails", async () => {
    api.login.mockRejectedValueOnce({ response: { data: { error: "Invalid email or password" } } });

    const user = userEvent.setup();
    render(<AuthScreen onAuthed={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/^email$/i), "user@example.com");
    await user.type(screen.getByPlaceholderText(/^password$/i), "supersecret");
    fireEvent.submit(screen.getByPlaceholderText(/^password$/i).closest("form"));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("shows an honest notice instead of a broken flow for Instagram", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuthed={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /continue with instagram/i }));
    expect(await screen.findByText(/meta folded it into their business api/i)).toBeInTheDocument();
  });

  it("points the Google and Facebook buttons at the real backend OAuth routes", () => {
    render(<AuthScreen onAuthed={vi.fn()} />);
    expect(screen.getByRole("link", { name: /continue with google/i })).toHaveAttribute(
      "href",
      "/api/auth/google"
    );
    expect(screen.getByRole("link", { name: /continue with facebook/i })).toHaveAttribute(
      "href",
      "/api/auth/facebook"
    );
  });
});
