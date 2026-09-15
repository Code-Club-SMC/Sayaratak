import {
	ChartNoAxesCombinedIcon,
	DollarSignIcon,
	Handshake,
	HandshakeIcon,
	HeartPlusIcon,
	LayoutDashboardIcon,
	MessagesSquareIcon,
	SaveCheckIcon,
	ScrollTextIcon,
	SettingsIcon,
	StoreIcon,
	UserCircleIcon,
	UserIcon,
	UserLock,
} from "lucide-react";
import type { AccountType, NavItemType, TrustItemsType } from "./types";

export const ACCOUNT_TYPE: AccountType[] = [
	{
		type: "user",
		title: "Individual User",
		description: "For people buying or selling vehicles, parts or services.",
		icon: UserCircleIcon,
	},
	{
		type: "dealership",
		title: "Dealership",
		description: "For car dealerships & showrooms.",
		icon: HandshakeIcon,
	},
	{
		type: "workshop",
		title: "Workshop",
		description: "For auto repair shops & workshops.",
		icon: StoreIcon,
	},
	{
		type: "mechanic",
		title: "Mechanic",
		description: "For independent mechanics.",
		icon: UserLock,
	},
];

export const USER_NAV_ITEMS: NavItemType[] = [
	{ title: "Overview", href: "/user/overview", icon: LayoutDashboardIcon },
	{ title: "My Listings", href: "/user/listings", icon: ScrollTextIcon },
	{
		title: "Saved Searches",
		href: "/user/saved-searches",
		icon: SaveCheckIcon,
	},
	{
		title: "Favourite Listings",
		href: "/user/favourites",
		icon: HeartPlusIcon,
	},
	{ title: "Messages", href: "/user/messages", icon: MessagesSquareIcon },
	{ title: "Account Settings", href: "/user/settings", icon: UserIcon },
];

export const DEALERSHIP_NAV_ITEMS: NavItemType[] = [
	{
		title: "Overview",
		href: "/dealership/overview",
		icon: LayoutDashboardIcon,
	},
	{
		title: "Listings Management",
		href: "/dealership/listings",
		icon: ScrollTextIcon,
	},
	{
		title: "Subscription Management",
		href: "/dealership/subscriptions",
		icon: DollarSignIcon,
	},
	{
		title: "Receive Messages",
		href: "/dealership/messages",
		icon: MessagesSquareIcon,
	},
	{
		title: "Reviews",
		href: "/dealership/reviews",
		icon: "/public/custom-svgs/reviews.svg",
	},
	{ title: "Analytics", href: "/dealership/analytics", icon: ScrollTextIcon },
	{
		title: "View Statistics",
		href: "/dealership/statistics",
		icon: ChartNoAxesCombinedIcon,
	},
	{
		title: "Dealer Profile",
		href: "/dealership/profile",
		icon: UserIcon,
	},
	{ title: "Settings", href: "/dealership/settings", icon: SettingsIcon },
];

export const CITIES = [
	{
		id: "peshawar",
		name: "Peshawar",
		countryCode: "PK",
	},
	{
		id: "islamabad",
		name: "Islamabad",
		countryCode: "PK",
	},
	{
		id: "lahore",
		name: "Lahore",
		countryCode: "PK",
	},
	{
		id: "karachi",
		name: "Karachi",
		countryCode: "PK",
	},
];

// export const TRUST_ITEMS: TrustItemsType[] = [
// 	{
// 		title: "",
// 		description: "",
// 		icon: ,
// 	},
// ];
