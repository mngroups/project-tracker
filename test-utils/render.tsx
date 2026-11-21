import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { TestWrapper } from "./test-wrapper";

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: TestWrapper,
    ...options,
  });
}
