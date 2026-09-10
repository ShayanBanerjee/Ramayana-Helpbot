import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PromptLibrary from "./PromptLibrary";
import { PROMPT_CATEGORIES, PROMPT_LIBRARY, promptsFor } from "./promptData";

describe("promptData", () => {
  it("every prompt belongs to a known category", () => {
    const ids = PROMPT_CATEGORIES.map((c) => c.id);
    for (const p of PROMPT_LIBRARY) {
      expect(ids).toContain(p.category);
    }
  });

  it("every category has at least one prompt", () => {
    for (const c of PROMPT_CATEGORIES) {
      expect(promptsFor(c.id).length).toBeGreaterThan(0);
    }
  });
});

describe("PromptLibrary", () => {
  it("shows the first category's prompts by default", () => {
    render(<PromptLibrary onClose={vi.fn()} onAsk={vi.fn()} />);
    const first = promptsFor(PROMPT_CATEGORIES[0].id);
    for (const p of first) {
      expect(screen.getByText(p.lead)).toBeInTheDocument();
    }
  });

  it("switches categories and shows that category's prompts", async () => {
    const user = userEvent.setup();
    render(<PromptLibrary onClose={vi.fn()} onAsk={vi.fn()} />);

    const events = PROMPT_CATEGORIES.find((c) => c.id === "events");
    await user.click(screen.getByText(events.label));

    const eventPrompts = promptsFor("events");
    expect(screen.getByText(eventPrompts[0].lead)).toBeInTheDocument();
  });

  it("calls onAsk with the full prompt text and closes", async () => {
    const onAsk = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PromptLibrary onClose={onClose} onAsk={onAsk} />);

    const first = promptsFor(PROMPT_CATEGORIES[0].id)[0];
    await user.click(screen.getByText(first.lead));

    expect(onAsk).toHaveBeenCalledWith(first.prompt);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on backdrop click but not on panel click", () => {
    const onClose = vi.fn();
    render(<PromptLibrary onClose={onClose} onAsk={vi.fn()} />);

    fireEvent.click(screen.getByText("Prompt Library"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector(".shlokaOverlay"));
    expect(onClose).toHaveBeenCalled();
  });
});
