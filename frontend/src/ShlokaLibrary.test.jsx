import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ShlokaLibrary from "./ShlokaLibrary";
import { PERSONAS, SHLOKAS, shlokasFor } from "./shlokas";

describe("shlokas data", () => {
  it("every shloka belongs to a known persona", () => {
    const ids = PERSONAS.map((p) => p.id);
    for (const s of SHLOKAS) {
      expect(ids).toContain(s.persona);
    }
  });

  it("every shloka has the required fields non-empty", () => {
    for (const s of SHLOKAS) {
      expect(s.devanagari.length).toBeGreaterThan(0);
      expect(s.transliteration.length).toBeGreaterThan(0);
      expect(s.translation.length).toBeGreaterThan(0);
      expect(s.source.length).toBeGreaterThan(0);
      expect(s.explanation.length).toBeGreaterThan(0);
    }
  });

  it("shlokasFor filters by persona", () => {
    for (const p of PERSONAS) {
      const list = shlokasFor(p.id);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((s) => s.persona === p.id)).toBe(true);
    }
  });
});

describe("ShlokaLibrary", () => {
  it("shows the first persona's shlokas by default", () => {
    render(<ShlokaLibrary onClose={vi.fn()} onAsk={vi.fn()} />);
    const firstPersonaShlokas = shlokasFor(PERSONAS[0].id);
    expect(screen.getAllByText(/Ask about this/i)).toHaveLength(firstPersonaShlokas.length);
    expect(screen.getByText(firstPersonaShlokas[0].translation)).toBeInTheDocument();
  });

  it("switches persona tabs and shows that persona's shlokas", async () => {
    const user = userEvent.setup();
    render(<ShlokaLibrary onClose={vi.fn()} onAsk={vi.fn()} />);

    const devPersona = PERSONAS.find((p) => p.id === "developer");
    await user.click(screen.getByText(devPersona.label));

    const devShlokas = shlokasFor("developer");
    expect(screen.getByText(devShlokas[0].translation)).toBeInTheDocument();
  });

  it("calls onAsk with a question about the shloka and closes", async () => {
    const onAsk = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShlokaLibrary onClose={onClose} onAsk={onAsk} />);

    const first = shlokasFor(PERSONAS[0].id)[0];
    await user.click(screen.getAllByText(/Ask about this/i)[0]);

    expect(onAsk).toHaveBeenCalledWith(expect.stringContaining(first.transliteration));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked, but not when the panel itself is clicked", () => {
    const onClose = vi.fn();
    render(<ShlokaLibrary onClose={onClose} onAsk={vi.fn()} />);

    fireEvent.click(screen.getByText("Sanskrit Shloka Library"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector(".shlokaOverlay"));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes via the close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ShlokaLibrary onClose={onClose} onAsk={vi.fn()} />);

    await user.click(screen.getByTitle("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
