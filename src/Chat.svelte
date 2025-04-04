<script>
  import Login from "./Login.svelte";
  import { onMount, onDestroy } from "svelte";
  import { username, user, db, ENCRYPTION_KEY } from "../stores/user.js";
  import debounce from "lodash.debounce";

  // GUN and SEA imports should be in user.js, but we need SEA here
  import SEA from "gun/sea";

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
      .get("fireside")
      .map(match)
      .on(async (data, id) => {
        if (!data) return;

        try {
          // Key for end-to-end encryption - using the new key
          const key = ENCRYPTION_KEY;

          // Get user info and decrypt message
          const who = (await db.user(data).get("alias")) || "Unknown";
          let what = "";

          try {
            what = (await SEA.decrypt(data.what, key)) + "";
          } catch (e) {
            console.error("Decryption error:", e);
            what = "[Encrypted message]";
          }

          const when = data._.put || Date.now();

          if (what) {
            // Generate a unique ID for this message by combining timestamp and content hash
            const uniqueId =
              when + "-" + Math.random().toString(36).substring(2, 9);

            // Check for duplicates with more thorough checking
            const isDuplicate = messages.some(
              (m) =>
                m.who === who &&
                m.what === what &&
                Math.abs(m.when - when) < 1000,
            );

            if (!isDuplicate) {
              messages = [
                ...messages.slice(-100),
                { who, what, when, id: uniqueId },
              ].sort((a, b) => a.when - b.when);

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
      const secret = await SEA.encrypt(newMessage, ENCRYPTION_KEY);
      const message = user.get("all").set({ what: secret });
      const index = new Date().toISOString();
      db.get("fireside").get(index).put(message);
      newMessage = "";
      canAutoScroll = true;
      autoScroll();
    } catch (err) {
      console.error("Send message error:", err);
      error = "Failed to send message: " + err.message;
    }
  }

  // Handle keydown event for textarea
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // Format timestamp for display
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
</script>

<div class="chat-container">
  {#if $username}
    <div class="messages-wrapper" on:scroll={debouncedWatchScroll}>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      {#if messages.length === 0}
        <div class="empty-state">
          <p>No messages yet. Be the first to say hello!</p>
        </div>
      {/if}

      {#each messages as message, i (i)}
        <div
          class="message-container {message.who === $username
            ? 'self'
            : 'other'}"
        >
          <div class="message-bubble">
            <div class="message-header">
              <span class="sender">{message.who}</span>
              <span class="timestamp">{formatTime(message.when)}</span>
            </div>
            <p class="message-text">{message.what}</p>
          </div>
        </div>
      {/each}

      <div class="scroll-anchor" bind:this={scrollBottom}></div>
    </div>

    <div class="message-input-container">
      <form on:submit|preventDefault={sendMessage}>
        <textarea
          bind:value={newMessage}
          on:keydown={handleKeyDown}
          placeholder="Type a message..."
          rows="1"
        ></textarea>
        <button type="submit" disabled={!newMessage.trim()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>

    {#if !canAutoScroll && unreadMessages}
      <div class="scroll-button">
        <button on:click={autoScroll} class="new-messages">
          ↓ New messages
        </button>
      </div>
    {/if}
  {:else}
    <Login />
  {/if}
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px); /* Accounting for header height */
    position: relative;
    overflow: hidden;
  }

  .messages-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f7f7f7;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
    display: flex;
    flex-direction: column;
  }

  .messages-wrapper::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #a0aec0;
    text-align: center;
    padding: 2rem;
  }

  .error-message {
    padding: 0.75rem;
    margin-bottom: 1rem;
    background-color: #fee2e2;
    color: #b91c1c;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .message-container {
    display: flex;
    margin-bottom: 0.75rem;
    animation: fadeIn 0.3s ease-in-out;
  }

  .message-container.self {
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 80%;
    padding: 0.75rem 1rem;
    border-radius: 1.25rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .self .message-bubble {
    background-color: #3b82f6;
    color: white;
    border-bottom-right-radius: 0.25rem;
  }

  .other .message-bubble {
    background-color: white;
    border-bottom-left-radius: 0.25rem;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .self .message-header {
    color: rgba(255, 255, 255, 0.9);
  }

  .other .message-header {
    color: #718096;
  }

  .message-text {
    margin: 0;
    word-break: break-word;
  }

  .message-input-container {
    background-color: white;
    border-top: 1px solid #e2e8f0;
    padding: 1rem;
    position: sticky;
    bottom: 0;
    width: 100%;
    z-index: 100;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  }

  form {
    display: flex;
    gap: 0.5rem;
  }

  textarea {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 1.5rem;
    padding: 0.75rem 1rem;
    resize: none;
    max-height: 100px;
    font-family: inherit;
    font-size: 1rem;
    outline: none;
  }

  textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background-color: #2563eb;
  }

  button:disabled {
    background-color: #cbd5e0;
    cursor: not-allowed;
  }

  .scroll-button {
    position: absolute;
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .new-messages {
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    border-radius: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-size: 0.875rem;
  }

  .scroll-anchor {
    height: 1px;
    width: 1px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
