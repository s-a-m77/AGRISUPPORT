import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppThemeProvider, ThemeSelector } from "@/components/AppTheme";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("App-wide theme", () => {
  it("changes the shared theme for registration and dashboard selectors together", () => {
    const { container } = render(
      <AppThemeProvider>
        <section aria-label="Registration">
          <ThemeSelector />
        </section>
        <section aria-label="Dashboard">
          <ThemeSelector />
        </section>
      </AppThemeProvider>,
    );
    const selectors = screen.getAllByRole("combobox", { name: "Color theme" });
    const [registration, dashboard] = selectors;
    if (!registration || !dashboard) throw new Error("Both screen selectors must exist");
    fireEvent.change(registration, { target: { value: "white" } });
    expect(container.querySelector("[data-theme]")?.getAttribute("data-theme")).toBe("white");
    expect(selectors[1]).toHaveValue("white");
    fireEvent.change(dashboard, { target: { value: "olive" } });
    expect(container.querySelector("[data-theme]")?.getAttribute("data-theme")).toBe("olive");
    expect(selectors[0]).toHaveValue("olive");
  });

  it("restores the chosen white theme after remounting", async () => {
    const first = render(
      <AppThemeProvider>
        <ThemeSelector />
      </AppThemeProvider>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "white" } });
    await waitFor(() => expect(localStorage.getItem("agrisense-theme")).toBe("white"));
    first.unmount();
    const second = render(
      <AppThemeProvider>
        <ThemeSelector />
      </AppThemeProvider>,
    );
    await waitFor(() =>
      expect(second.container.querySelector("[data-theme]")?.getAttribute("data-theme")).toBe(
        "white",
      ),
    );
  });
});
