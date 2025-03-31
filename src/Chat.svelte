<script>
  import Login from "./Login.svelte";
  import ChatMessage from "./ChatMessage.svelte";
  import { onMount, onDestroy } from "svelte";
  import { username, user } from "./user";
  import debounce from "lodash.debounce";

  import GUN from "gun";
  import "gun/sea"; // Missing SEA import

  // Use a specific peer configuration
  const db = GUN(["https://gun-manhattan.herokuapp.com/gun"]);

  let newMessage = "";
  let messages = [];
  let messageListener;
  let scrollBottom;
  let lastScrollTop;
  let canAutoScroll = true;
  let unreadMessages = false;
  let error = null;

  function autoScroll() {
    setTimeout(() => scrollBottom?.scrollIntoView({ behavior: "auto" }), 50);
    unreadMessages = false;
  }

  function watchScroll(e) {
    canAutoScroll = (e.target.scrollTop || Infinity) > lastScrollTop;
    lastScrollTop = e.target.scrollTop;
  }

  $: debouncedWatchScroll = debounce(watchScroll, 1000);

  // Set up message listening
  function setupMessageListener() {
    if (messageListener) return; // Prevent duplicate listeners

    var match = {
      ".": {
        ">": new Date(+new Date() - 1 * 1000 * 60 * 60 * 3).toISOString(),
      },
      "-": 1,
    };

    // Get Messages with real-time updates using .on() instead of .once()
    messageListener = db
      .get("awesomechat")
      .map(match)
      .on(async (data, id) => {
        if (!data) return;

        try {
          // Key for end-to-end encryption
          const key = "#foo.awesomechat";

          // Get user info and decrypt message
          const who = (await db.user(data).get("alias")) || "Unknown";
          let what = "";

          try {
            what = (await SEA.decrypt(data.what, key)) + "";
          } catch (e) {
            console.error("Decryption error:", e);
            what = "[Encrypted message]";
          }

          const when = GUN.state.is(data, "what") || Date.now();

          if (what) {
            // Check for duplicates before adding
            const isDuplicate = messages.some(
              (m) => m.when === when && m.who === who && m.what === what,
            );

            if (!isDuplicate) {
              messages = [...messages.slice(-100), { who, what, when }].sort(
                (a, b) => a.when - b.when,
              );

              if (canAutoScroll) {
                autoScroll();
              } else {
                unreadMessages = true;
              }
            }
          }
        } catch (err) {
          console.error("Message processing error:", err);
          error = err.message;
        }
      });
  }

  onMount(() => {
    if ($username) {
      setupMessageListener();
    }
  });

  // Set up and tear down listeners when username changes
  $: if ($username) {
    setupMessageListener();
  } else if (messageListener) {
    messageListener.off();
    messageListener = null;
  }

  onDestroy(() => {
    if (messageListener) {
      messageListener.off();
    }
  });

  async function sendMessage() {
    if (!newMessage || !$username) return;

    try {
      const secret = await SEA.encrypt(newMessage, "#foo.awesomechat");
      const message = user.get("all").set({ what: secret });
      const index = new Date().toISOString();
      db.get("awesomechat").get(index).put(message);
      newMessage = "";
      canAutoScroll = true;
      autoScroll();
    } catch (err) {
      console.error("Send message error:", err);
      error = "Failed to send message: " + err.message;
    }
  }
</script>

<div class="container">
  {#if $username}
    <main on:scroll={debouncedWatchScroll}>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      {#if messages.length === 0}
        <div class="empty-state">
          No messages yet. Be the first to say hello!
        </div>
      {/if}

      {#each messages as message (message.when)}
        <ChatMessage {message} sender={$username} />
      {/each}

      <div class="dummy" bind:this={scrollBottom} />
    </main>

    <form on:submit|preventDefault={sendMessage} class="message-input">
      <input
        type="text"
        placeholder="Type a message..."
        bind:value={newMessage}
        maxlength="1000"
      />

      <button type="submit" disabled={!newMessage}>🔥</button>
    </form>

    {#if !canAutoScroll}
      <div class="scroll-button">
        <button on:click={autoScroll} class:red={unreadMessages}>
          {#if unreadMessages}💬{/if}
          ⬇️
        </button>
      </div>
    {/if}
  {:else}
    <main>
      <Login />
    </main>
  {/if}
</div>
