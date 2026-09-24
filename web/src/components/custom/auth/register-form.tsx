import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type z from "zod";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Separator } from "#/components/ui/separator";
import { authClient } from "#/lib/auth-client";
import { ACCOUNT_TYPE, CITIES } from "#/lib/constants";
import { registerFormSchema } from "#/lib/schemas/auth";
import { cn } from "#/lib/utils";
import { CitySelector } from "../general/city-selector";
import { CountrySelector } from "../general/country-selector";

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const RegisterForm = () => {
	const form = useForm<RegisterFormValues>({
		resolver: zodResolver(registerFormSchema),
		defaultValues: {
			accountType: "user",
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
			city: "",
			country: "",
			acceptTerms: false,
		},
	});

	const onSubmit = async (value: RegisterFormValues) => {
		await authClient.signUp.email(
			{
				name: value.fullName,
				email: value.email,
				password: value.password,
				cityId: value.city,
			},
			{
				onSuccess: () => {
					toast.success("Verification email sent!", {
						description:
							"Please check your mail and click the link to verify your email address.",
					});
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "An unknown error occurred");
				},
			},
		);
	};

	return (
		<form
			className="flex justify-start items-start gap-x-20"
			id="register-form"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<div className="flex flex-col gap-y-10">
				<div className="flex flex-col gap-y-1">
					<h4 className="font-semibold">1. Choose Account Type</h4>
					<p className="text-xs text-gray-500">
						Select the type of account that fits you best
					</p>
				</div>
				<Controller
					name="accountType"
					control={form.control}
					render={({ field }) => (
						<RadioGroup value={field.value} onValueChange={field.onChange}>
							{ACCOUNT_TYPE.map((account) => (
								<FieldLabel
									className={cn(
										"h-20 flex items-center justify-center",
										field.value === account.type ? "border border-primary" : "",
									)}
									key={account.type}
									htmlFor={account.type}
								>
									<Field orientation="horizontal">
										<FieldContent className="flex flex-row items-center gap-x-4">
											{typeof account.icon === "string" ? (
												<img
													src={account.icon}
													className="size-10 object-cover"
													alt={account.title}
												/>
											) : (
												<account.icon
													className={cn(
														"size-7",
														field.value === account.type ? "text-primary" : "",
													)}
												/>
											)}
											<div className="flex flex-col items-start gap-x-5 gap-y-1">
												<FieldTitle className="text-base font-medium">
													{account.title}
												</FieldTitle>
												<FieldDescription>
													{account.description}
												</FieldDescription>
											</div>
										</FieldContent>
										<RadioGroupItem value={account.type} id={account.type} />
									</Field>
								</FieldLabel>
							))}
						</RadioGroup>
					)}
				/>
			</div>

			<Separator orientation="vertical" />

			<div className="flex flex-col w-md gap-y-10">
				<div className="flex flex-col gap-y-1">
					<h4 className="font-semibold">2. Create Your Account</h4>
					<p className="text-xs text-gray-500">
						Please enter your details to create your account.
					</p>
				</div>

				<div className="flex flex-col gap-y-3">
					<Controller
						name="fullName"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={field.name}>Full Name</FieldLabel>

								<Input
									{...field}
									id={field.name}
									aria-invalid={fieldState.invalid}
									placeholder="Ada Lovelace"
									autoComplete="name"
								/>

								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>

					<Controller
						name="email"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor={field.name}>Email</FieldLabel>

								<Input
									{...field}
									id={field.name}
									type="email"
									aria-invalid={fieldState.invalid}
									placeholder="example@example.com"
									autoComplete="email"
								/>

								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>

					<FieldGroup>
						<Controller
							name="password"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>Password</FieldLabel>

									<Input
										{...field}
										id={field.name}
										type="password"
										aria-invalid={fieldState.invalid}
										placeholder="Password"
										autoComplete="new-password"
									/>

									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Controller
							name="confirmPassword"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>

									<Input
										{...field}
										id={field.name}
										type="password"
										aria-invalid={fieldState.invalid}
										placeholder="Confirm Password"
										autoComplete="new-password"
									/>

									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>

					<FieldGroup className="mt-5 grid grid-cols-2">
						<Controller
							name="country"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>Country</FieldLabel>

									<CountrySelector
										value={field.value}
										onChange={field.onChange}
									/>

									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						<Controller
							name="city"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor={field.name}>City</FieldLabel>

									<CitySelector
										countryCode={form.watch("country")}
										value={field.value}
										onChange={field.onChange}
										cities={CITIES}
									/>

									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>

					<Controller
						name="acceptTerms"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field
								className="mt-5"
								orientation="horizontal"
								data-invalid={fieldState.invalid}
							>
								<Checkbox
									id={field.name}
									name={field.name}
									checked={field.value}
									onCheckedChange={field.onChange}
									aria-invalid={fieldState.invalid}
								/>
								<FieldLabel
									htmlFor={field.name}
									className="font-normal gap-1 m-0 p-0"
								>
									I agree to the{" "}
									<Link
										to="/terms-of-service"
										className="text-primary underline-offset-4 hover:underline"
									>
										Terms of Service
									</Link>
									and
									<Link
										to="/privacy-policy"
										className="text-primary underline-offset-4 hover:underline"
									>
										Privacy Policy
									</Link>
									.
								</FieldLabel>

								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
					<Button type="submit" className="mt-2">
						Register
					</Button>
				</div>
			</div>
		</form>
	);
};
