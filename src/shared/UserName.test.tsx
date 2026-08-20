import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import UserName from "./UserName";

// UserName builds an <abbr title="..."> from up to four optional fields
// (organization/email are both optional). The interesting logic is entirely
// in how it joins those pieces, so this covers the full/empty/partial cases.
describe("UserName", () => {
  it("shows 'Last, First' and a title with organization and email", () => {
    render(
      <UserName
        user={{ firstName: "Ada", lastName: "Lovelace", organization: "PSC", email: "ada@example.com" }}
      />,
    );
    const abbr = screen.getByText("Lovelace, Ada");
    expect(abbr.tagName).toBe("ABBR");
    expect(abbr).toHaveAttribute("title", "Lovelace, Ada: PSC, ada@example.com");
  });

  it("omits the colon suffix entirely when organization and email are both absent", () => {
    render(<UserName user={{ firstName: "Grace", lastName: "Hopper" }} />);
    expect(screen.getByText("Hopper, Grace")).toHaveAttribute("title", "Hopper, Grace");
  });

  it("joins only the field that is present when just one of organization/email is set", () => {
    render(<UserName user={{ firstName: "Grace", lastName: "Hopper", email: "grace@example.com" }} />);
    expect(screen.getByText("Hopper, Grace")).toHaveAttribute(
      "title",
      "Hopper, Grace: grace@example.com",
    );
  });
});
