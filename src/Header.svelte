<script>
	import {username, user} from "./user";

	function signout(){
		user.leave();
		username.set("");
	}

</script>
<header>
	<h2>👻⚡️💀</h2>
	{#if $username}
		<div class='user-bio'>
			<div class='user-name'>Hello <strong>{$username}</strong></div>
			<img src='{`https://avatars.dicebear.com/api/adventurer/${$username}.svg`}' alt='avatar'/>
		</div>
		<button class="signout-button" on:click={signout}>
			Sign out
		</button>
		{:else}
		<h3>W3BCHAT-Squbix</h3>
	{/if}
</header>