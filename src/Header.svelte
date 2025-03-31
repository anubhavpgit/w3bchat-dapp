<script>
	import { username, user } from "./user";

	function signout() {
		try {
			user.leave();
			username.set("");
		} catch (err) {
			console.error("Signout error:", err);
			// Force reset on error
			localStorage.clear();
			sessionStorage.clear();
			window.location.reload();
		}
	}

	// Updated DiceBear API URL
	$: avatarUrl = $username
		? `https://api.dicebear.com/6.x/adventurer/svg?seed=${encodeURIComponent($username)}`
		: `https://api.dicebear.com/6.x/adventurer/svg?seed=guest`;
</script>

<header>
	<h4>Fireside</h4>
	{#if $username}
		<div class="user-bio">
			<img src={avatarUrl} alt="avatar" />
			<div class="user-name">Hello <strong>{$username}</strong></div>
			<button class="signout-button" on:click={signout}>Sign out</button>
		</div>
	{:else}
		<div class="user-bio">
			<img src={avatarUrl} alt="avatar" />
			<div class="user-name">Hello <strong>Guest</strong></div>
		</div>
	{/if}
</header>
