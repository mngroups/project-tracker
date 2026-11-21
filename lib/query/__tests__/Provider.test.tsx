import { useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueryProvider } from "../Provider";

function Probe() {
  const client = useQueryClient();
  return <span>{client.getDefaultOptions().queries?.staleTime === 300_000 ? "ok" : "no"}</span>;
}

describe("QueryProvider", () => {
  it("provides the app query client", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
