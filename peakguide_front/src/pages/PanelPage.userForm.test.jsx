import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// mock AuthContext
vi.mock("../auth/AuthContext", () => ({
	useAuth: () => ({
		status: "authed",
		user: { email: "admin@test.com", display_name: "Admin", is_admin: true },
	}),
}));

// mock children sections (żeby nie odpalać fetchy)
vi.mock("../features/adminMessages/AdminMessagesSection", () => ({
	default: () => <div>AdminMessagesSection</div>,
}));
vi.mock("../features/adminPeaks/AdminPeaksSection", () => ({
	default: () => <div>AdminPeaksSection</div>,
}));
vi.mock("../features/adminUsers/AdminUsersSection", () => ({
	default: () => <div>AdminUsersSection</div>,
}));
vi.mock("./AdminTools", () => ({
	default: () => <div>AdminTools</div>,
}));

describe("PanelPage (admin)", () => {
	it("shows tabs and switches content", async () => {
		const { default: PanelPage } = await import("./PanelPage");

		render(<PanelPage lang='pl' />);

		expect(screen.getByText("AdminMessagesSection")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /peaks/i }));
		expect(screen.getByText("AdminPeaksSection")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /users/i }));
		expect(screen.getByText("AdminUsersSection")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /tools/i }));
		expect(screen.getByText("AdminTools")).toBeInTheDocument();
	});
});
