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

export type City = {
	id: string;
	name: string;
	countryCode: string;
};

type CitySelectorProps = {
	countryCode?: string;
	value?: string;
	onChange: (value: string) => void;
	cities: City[];
	placeholder?: string;
	disabled?: boolean;
};

export function CitySelector({
	countryCode,
	value,
	onChange,
	cities,
	placeholder = "Select city",
	disabled = false,
}: CitySelectorProps) {
	const [open, setOpen] = useState(false);

	const countryCities = useMemo(() => {
		if (!countryCode) return [];

		return cities
			.filter((city) => city.countryCode === countryCode)
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [cities, countryCode]);

	const selectedCity = countryCities.find((city) => city.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled || !countryCode}
						className="w-full justify-between font-normal"
					/>
				}
			>
				{selectedCity ? (
					<span>{selectedCity.name}</span>
				) : (
					<span className="text-muted-foreground">
						{countryCode ? placeholder : "Select a country first"}
					</span>
				)}

				<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
			</PopoverTrigger>

			<PopoverContent className="w-[var(--anchor-width)] p-0">
				<Command>
					<CommandInput placeholder="Search city..." />

					<CommandList>
						<CommandEmpty>No city found.</CommandEmpty>

						<CommandGroup>
							{countryCities.map((city) => (
								<CommandItem
									key={city.id}
									value={city.name}
									onSelect={() => {
										onChange(city.id);
										setOpen(false);
									}}
								>
									<span className="flex-1">{city.name}</span>

									<Check
										className={cn(
											"size-4",
											value === city.id ? "opacity-100" : "opacity-0",
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
