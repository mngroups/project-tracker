import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthCard, AuthCardTitle, AuthLayout } from "../auth-card";

const LOGO = "https://auth.test/branding/orgs/pt/logo";

describe("AuthLayout + AuthCard", () => {
  it("renders the logo inside the card, above the title", () => {
    const { container } = render(
      <AuthLayout logoUrl={LOGO}>
        <AuthCard>
          <AuthCardTitle>Masuk</AuthCardTitle>
        </AuthCard>
      </AuthLayout>
    );
    const card = screen.getByRole("heading", { name: "Masuk" }).parentElement as HTMLElement;
    const imgs = card.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[1]).toHaveAttribute("src", `${LOGO}?variant=dark`);
    expect(card.firstElementChild?.contains(imgs[0])).toBe(true);
    // nothing but the card sits in the backdrop
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it("shows the app name in the card without a logo", () => {
    render(
      <AuthLayout>
        <AuthCard>
          <AuthCardTitle>Keluar</AuthCardTitle>
        </AuthCard>
      </AuthLayout>
    );
    const card = screen.getByRole("heading", { name: "Keluar" }).parentElement as HTMLElement;
    expect(card).toHaveTextContent("Project Tracker");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses theme tokens instead of hard-coded colors", () => {
    render(
      <AuthLayout>
        <AuthCard>
          <AuthCardTitle>Judul</AuthCardTitle>
        </AuthCard>
      </AuthLayout>
    );
    const title = screen.getByRole("heading", { name: "Judul" });
    expect(title.parentElement).toHaveClass("bg-card", "text-card-foreground");
    expect(title.parentElement).not.toHaveClass("bg-white");
    expect(title).not.toHaveClass("text-gray-900");
  });
});
