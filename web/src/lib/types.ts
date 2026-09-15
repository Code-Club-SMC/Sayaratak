import type { LucideIcon } from "lucide-react";

export type AccountType = {
	type: "user" | "dealership" | "workshop" | "mechanic";
	title: string;
	description: string;
	icon: string | LucideIcon;
};

export type TrustItemsType = {
	icon: string | LucideIcon;
	title: string;
	description: string;
};

export type NavItemType = {
	title: string;
	href: string;
	icon: string | LucideIcon;
};
