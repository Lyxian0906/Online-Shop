import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.css"; // reuses the login page styles

export function ResetPasswordPage() {
	// Clicking the email link logs the user in with a temporary "recovery" session,
	// so isLoggedIn is true here only if the link was valid.
	const { isLoggedIn, loading } = useAuth();
	const navigate = useNavigate();

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		if (password !== confirm) {
			setError("The passwords do not match.");
			return;
		}

		setSubmitting(true);
		const { error: updateError } = await supabase.auth.updateUser({ password });
		setSubmitting(false);

		if (updateError) {
			setError(updateError.message);
			return;
		}

		setDone(true);
		setTimeout(() => navigate("/"), 1500);
	}

	if (loading) {
		return (
			<div className="login-page">
				<p>Checking your link...</p>
			</div>
		);
	}

	if (!isLoggedIn) {
		return (
			<div className="login-page">
				<div className="login-form">
					<h1>Link not valid</h1>
					<p className="login-error">This link is invalid or has expired.</p>
					<Link className="login-switch" to="/forgot-password">
						Send me a new link
					</Link>
				</div>
			</div>
		);
	}

	if (done) {
		return (
			<div className="login-page">
				<div className="login-form">
					<h1>Password updated</h1>
					<p className="login-message">Taking you to the store...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="login-page">
			<form className="login-form" onSubmit={handleSubmit}>
				<h1>Choose a new password</h1>

				<label htmlFor="password">New password</label>
				<input
					id="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="new-password"
					minLength={6}
					required
				/>

				<label htmlFor="confirm">Repeat the password</label>
				<input
					id="confirm"
					type="password"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					autoComplete="new-password"
					minLength={6}
					required
				/>

				{error && (
					<p className="login-error" role="alert">
						{error}
					</p>
				)}

				<button type="submit" className="login-submit" disabled={submitting}>
					{submitting ? "Please wait..." : "Save new password"}
				</button>
			</form>
		</div>
	);
}

/*

You can only arrive to this page by clicking the link in the mail
You maybe asking why we need the const:  	const { isLoggedIn, loading } = useAuth();
well this is just a security messure to ensure that the user didn't just access by typing on the web /reset-password
Instead of acessing with the link sent to their mail.

So the link on the mail logs u into a temporarly session
So it returns true if all went okay and then shows this page
If it returns false basically it means that the link was already used, or it was invalid

The loading it's just because when we open the link, supabase needs like a moment in order to do somethings
And so during that moment the variable we created is false, so if we don't have the loading
basically it would show a Link is not valid for some seconds, even tho the link was valid

This page remembers
The password and confirm, both boxes Line 23
error, submitting like the other page
done: true, basically if the password is saved

If the link we used is not valid it shows us an option to send a new link Line 55
And if all goes well then done becomes true and sends u to the store page Line 63
If the passwords was typed wrong it will show an error and u can type again

When u press the save a password the handleSubmit checks if both boxes match
if they match i calls:
       supabase.auth.updateUser({ password });

This basically changes the pass of whoever is logged in.


*/