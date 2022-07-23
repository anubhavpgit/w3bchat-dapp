<script>
	import {username, user} from "./user";

	function signout(){
		user.leave();
		username.set("");
	}

</script>
<header>
	<h4>👻⚡️💀</h4>
	{#if $username}
		<div class='user-bio'>
			<div class='user-name'>Hello <strong>{$username}</strong></div>
			<!-- <img src='{`https://avatars.dicebear.com/api/adventurer/${$username}.svg`}' alt='avatar'/> -->
		</div>
		<button class="signout-button" on:click={signout}>
			Sign out
		</button>
		{:else}
		<h4>W3BCHAT-Squbix</h4>
	{/if}
</header>