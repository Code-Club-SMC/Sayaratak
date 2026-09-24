import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

// In real app, we use actual dictionaries
const profileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(9, "Valid phone number required"),
	city: z.string().min(1, "City is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
	user: {
		name: string;
		email: string;
		phone?: string;
		city?: string;
		image?: string | null;
	};
	onSave: (data: ProfileFormValues) => Promise<void>;
};

export function ProfileForm({ user, onSave }: ProfileFormProps) {
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: user.name,
			email: user.email,
			phone: user.phone || "",
			city: user.city || "khartoum",
		},
	});

	async function onSubmit(data: ProfileFormValues) {
		setIsLoading(true);
		try {
			await onSave(data);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
			{/* Avatar Upload Section */}
			<div className="flex items-center gap-6">
				<div className="relative group cursor-pointer">
					<Avatar className="size-24 border-2 border-border shadow-sm">
						<AvatarImage src={user.image || undefined} alt={user.name} />
						<AvatarFallback className="text-2xl bg-primary/10 text-primary">
							{user.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
						<Camera className="size-6 text-white" />
					</div>
				</div>
				<div>
					<h4 className="text-sm font-semibold mb-1">Profile Photo</h4>
					<p className="text-xs text-muted-foreground mb-3">
						Recommended 256x256px. Max 2MB.
					</p>
					<Button variant="outline" size="sm" type="button">
						Upload New
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div className="space-y-2">
					<label htmlFor="profile-name" className="text-sm font-medium">
						Full Name
					</label>
					<Input
						id="profile-name"
						placeholder="Ahmed Mohammed"
						{...register("name")}
					/>
					{errors.name && (
						<p className="text-xs text-destructive">{errors.name.message}</p>
					)}
				</div>
				<div className="space-y-2">
					<label htmlFor="profile-email" className="text-sm font-medium">
						Email Address
					</label>
					<Input
						id="profile-email"
						type="email"
						placeholder="ahmed@example.com"
						disabled
						{...register("email")}
					/>
					<p className="text-[0.8rem] text-muted-foreground">
						Email cannot be changed directly.
					</p>
					{errors.email && (
						<p className="text-xs text-destructive">{errors.email.message}</p>
					)}
				</div>
				<div className="space-y-2">
					<label htmlFor="profile-phone" className="text-sm font-medium">
						Phone Number
					</label>
					<Input
						id="profile-phone"
						type="tel"
						placeholder="+249 9X XXX XXXX"
						{...register("phone")}
					/>
					{errors.phone && (
						<p className="text-xs text-destructive">{errors.phone.message}</p>
					)}
				</div>
				<div className="space-y-2">
					<label htmlFor="profile-city" className="text-sm font-medium">
						City
					</label>
					<NativeSelect id="profile-city" {...register("city")}>
						<option value="khartoum">Khartoum</option>
						<option value="omdurman">Omdurman</option>
						<option value="bahri">Bahri</option>
						<option value="port-sudan">Port Sudan</option>
					</NativeSelect>
					{errors.city && (
						<p className="text-xs text-destructive">{errors.city.message}</p>
					)}
				</div>
			</div>

			<div className="flex justify-end pt-4 border-t border-border">
				<Button type="submit" disabled={isLoading} className="gap-2">
					{isLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Save className="size-4" />
					)}
					<span>Save Changes</span>
				</Button>
			</div>
		</form>
	);
}
