import { screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Opens a `FormDatePicker` by its `testId` and picks `day` in the month it opens on
 * (the selected date's month, else the current WITA month).
 */
export async function pickDate(user: UserEvent, testId: string, day: number) {
  await user.click(screen.getByTestId(testId));
  const grid = await screen.findByRole("grid");
  const cell = within(grid)
    .getAllByRole("gridcell")
    .find((c) => !c.hasAttribute("data-outside") && c.textContent === String(day));
  if (!cell) throw new Error(`Day ${day} is not in the open month`);
  await user.click(within(cell).getByRole("button"));
}
