// TEMPLATE: unit test. Assert roles, text and callbacks, never className.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { Example } from "./Example";

describe("Example", () => {
  it("shows its label", () => {
    render(<Example label="Live" />);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("toggles itself when uncontrolled", () => {
    const onSelectedChange = vi.fn();
    render(<Example label="Live" onSelectedChange={onSelectedChange} />);
    const button = screen.getByRole("button", { name: "Live" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onSelectedChange.mock.calls).toEqual([[true], [false]]);
  });

  it("stays put when controlled and reports the requested change", () => {
    const onSelectedChange = vi.fn();
    render(
      <Example
        label="Live"
        isSelected={false}
        onSelectedChange={onSelectedChange}
      />,
    );
    const button = screen.getByRole("button", { name: "Live" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onSelectedChange.mock.calls).toEqual([[true], [true]]);
  });

  it("ignores presses when disabled", () => {
    const onSelectedChange = vi.fn();
    render(
      <Example label="Live" isDisabled onSelectedChange={onSelectedChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Live" }));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example label="Live" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
