import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

countries.registerLocale(en);

type CountrySelectorProps = {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
};

export function CountrySelector({
	value,
	onChange,
	placeholder = "Select country",
	disabled = false,
}: CountrySelectorProps) {
	const [open, setOpen] = useState(false);

	const countryList = useMemo(() => {
		const names = countries.getNames("en");

		return Object.entries(names)
			.map(([code, name]) => ({
				code,
				name,
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, []);

	const selectedCountry = countryList.find((country) => country.code === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className="w-full justify-between font-normal"
					/>
				}
			>
				{selectedCountry ? (
					<span className="flex items-center gap-2">
						<span>{getFlagEmoji(selectedCountry.code)}</span>
						<span>{selectedCountry.name}</span>
					</span>
				) : (
					<span className="text-muted-foreground">{placeholder}</span>
				)}

				<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
			</PopoverTrigger>

			<PopoverContent className="w-[var(--anchor-width)] p-0">
				<Command>
					<CommandInput placeholder="Search country..." />

					<CommandList>
						<CommandEmpty>No country found.</CommandEmpty>

						<CommandGroup>
							{countryList.map((country) => (
								<CommandItem
									key={country.code}
									value={country.name}
									onSelect={() => {
										onChange(country.code);
										setOpen(false);
									}}
								>
									<span className="mr-2">{getFlagEmoji(country.code)}</span>

									<span className="flex-1">{country.name}</span>

									<Check
										className={cn(
											"size-4",
											value === country.code ? "opacity-100" : "opacity-0",
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

function getFlagEmoji(countryCode: string) {
	return countryCode
		.toUpperCase()
		.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
