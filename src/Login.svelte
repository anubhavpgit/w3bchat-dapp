<script>
  import { user } from './user';

  let username;
  let password;

  function login() {
    user.auth(username, password, ({ err }) => err && alert(err));
  }

  function signup() {
    user.create(username, password, ({ err }) => {
      if (err) {
        alert(err);
      } else {
        login();
      }
    });
  }
</script>
<form on:submit|preventDefault={login}>
  <label for="username">Username</label>
<input name="username" bind:value={username} minlength="3" maxlength="16" type="text"/>

<label for="password">Password</label>
<input name="password" bind:value={password} type="password" />
<br>
<button class="login" on:click={login}>Login</button>
<button class="login"  on:click={signup}>Sign Up</button>
  

</form>

