<script>
  import { user } from "./user"; // Assuming user object from user.js is correctly imported

  let username = "";
  let password = "";
  let isLoading = false; // Local loading state for the form UI
  let errorMessage = "";

  // Login function: Initiates Gun authentication
  async function login(e) {
    console.log("Login function called with:", username, password);
    // Prevent default form submission if triggered by form's submit event
    e?.preventDefault();
    console.log(username, password, isLoading);

    // Basic validation and prevent concurrent actions
    if (!username || !password || isLoading) return;

    errorMessage = "";
    isLoading = true;

    try {
      console.log("Starting login process...");
      // Wrap the callback-based user.auth in a Promise for async/await
      await new Promise((resolve, reject) => {
        console.log("Attempting login with:", username);
        user.auth(username, password, ({ err }) => {
          if (err) {
            console.error("Login callback error:", err);
            // Reject the promise if Gun's callback provides an error
            reject(err);
          } else {
            console.log("Login callback success (auth initiated)");
            // Resolve the promise on success (doesn't mean user is fully authenticated *yet*,
            // db.on('auth') listener in user.js handles the confirmation)
            resolve();
          }
        });
      });
      // Note: Successful resolution here means user.auth *initiated* without immediate error.
      // The actual confirmation comes via the db.on('auth') listener.
      // We don't need to set success state here, user.js handles it.
      console.log(
        "Login attempt finished successfully from component perspective.",
      );
    } catch (err) {
      console.error("Login function caught error:", err);
      errorMessage =
        typeof err === "string"
          ? err
          : err.message || "Login failed. Please check credentials.";
    } finally {
      // Ensure loading state is always reset
      isLoading = false;
    }
  }

  // Signup function: Creates user, then logs them in
  async function signup(e) {
    // Prevent default if called from a form submit (though usually called via button click)
    e?.preventDefault();

    // Basic validation and prevent concurrent actions
    if (!username || !password || isLoading) return;

    errorMessage = "";
    isLoading = true; // Set loading for the combined signup + login process

    try {
      // 1. Attempt to create the user
      await new Promise((resolve, reject) => {
        console.log("Attempting signup with:", username);
        user.create(username, password, ({ err }) => {
          if (err) {
            console.error("Signup callback error:", err);
            // Reject the promise if Gun's callback provides an error
            reject(err);
          } else {
            console.log("Signup callback success (user created)");
            // Resolve the promise if user creation was successful
            resolve();
          }
        });
      });
      console.log("Signup successful, proceeding to login...");
      isLoading = false; // Set loading to false after signup

      // 2. Only attempt login if signup was successful (promise resolved)
      // Call the existing login function to handle the authentication process
      await login(); // No 'e' argument needed here

      // If login() throws an error, it will be caught by the outer catch block.
      // If login() succeeds in initiating auth, the db.on('auth') listener will handle the rest.
    } catch (err) {
      console.error("Signup function caught error:", err);
      // Handle errors from either user.create or the subsequent login() call
      errorMessage =
        typeof err === "string"
          ? err
          : err.message || "Signup failed. Username might be taken or invalid.";
    } finally {
      // Ensure loading state is reset after the entire signup + login attempt
      isLoading = false;
    }
  }
</script>

<!-- HTML remains the same, it correctly uses the state variables -->
<form on:submit|preventDefault={login} class="login-form">
  {#if errorMessage}
    <div class="error-message">{errorMessage}</div>
  {/if}

  <label for="username">Username</label>
  <input
    id="username"
    name="username"
    bind:value={username}
    minlength="3"
    maxlength="16"
    type="text"
    disabled={isLoading}
    required
  />

  <label for="password">Password</label>
  <input
    id="password"
    name="password"
    bind:value={password}
    type="password"
    disabled={isLoading}
    required
  />

  <div class="button-group">
    <button
      type="submit"
      class="login"
      disabled={isLoading || !username || !password}
    >
      {#if isLoading}Logging in...{:else}Login{/if}
    </button>
    <button
      type="button"
      class="signup"
      on:click={signup}
      disabled={isLoading || !username || !password}
    >
      {#if isLoading}Working...{:else}Sign Up{/if}
    </button>
  </div>
</form>
