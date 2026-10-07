import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Header } from "../../components/Header";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import "./AccountPage.css";

export function AccountPage({ cart }) {
	const { session, profile, isAdmin, signOut } = useAuth();
	const navigate = useNavigate();

	const email = profile?.email ?? session?.user?.email ?? "";

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [saving, setSaving] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setMessage("");

		if (newPassword !== confirm) {
			setError("The new passwords do not match.");
			return;
		}
		if (newPassword === currentPassword) {
			setError("Choose a password different from the current one.");
			return;
		}

		setSaving(true);


		const { error: checkError } = await supabase.auth.signInWithPassword({
			email,
			password: currentPassword,
		});

		if (checkError) {
			setSaving(false);
			setError("The current password is not correct.");
			return;
		}

		// 2. Save the new one.
		const { error: updateError } = await supabase.auth.updateUser({
			password: newPassword,
		});
		setSaving(false);

		if (updateError) {
			setError(updateError.message);
			return;
		}

		setCurrentPassword("");
		setNewPassword("");
		setConfirm("");
		setMessage("Password updated.");
	}

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}

	return (
		<>
			<Header cart={cart} />

			<div className="account-page">
				<h1>My account</h1>

				<section className="account-section">
					<dl className="account-details">
						<dt>Email</dt>
						<dd>{email}</dd>
						<dt>Account type</dt>
						<dd>{isAdmin ? "Admin" : "Customer"}</dd>
					</dl>

					<div className="account-links">
						<Link to="/orders">My orders</Link>
						{isAdmin && <Link to="/admin">Manage products</Link>}
					</div>
				</section>

				<section className="account-section">
					<h2>Change password</h2>

					<form className="account-form" onSubmit={handleSubmit}>
						<label htmlFor="current-password">Current password</label>
						<input
							id="current-password"
							type="password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							autoComplete="current-password"
							required
						/>

						<label htmlFor="new-password">New password</label>
						<input
							id="new-password"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							autoComplete="new-password"
							minLength={6}
							required
						/>

						<label htmlFor="confirm-password">Repeat the new password</label>
						<input
							id="confirm-password"
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							autoComplete="new-password"
							minLength={6}
							required
						/>

						{error && (
							<p className="account-error" role="alert">
								{error}
							</p>
						)}
						{message && (
							<p className="account-message" role="status">
								{message}
							</p>
						)}

						<button type="submit" className="account-primary" disabled={saving}>
							{saving ? "Saving..." : "Save new password"}
						</button>
					</form>
				</section>

				<section className="account-section">
					<button
						type="button"
						className="account-logout"
						onClick={handleSignOut}
					>
						Log out
					</button>
				</section>
			</div>
		</>
	);
}
