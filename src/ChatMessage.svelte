<script>
  export let message;
  export let sender;

  // Add fallbacks for possible undefined values
  $: messageClass = message?.who === sender ? "sent" : "received";

  // Updated DiceBear API URL
  $: avatar = message?.who
    ? `https://api.dicebear.com/6.x/adventurer/svg?seed=${encodeURIComponent(message.who)}`
    : `https://api.dicebear.com/6.x/adventurer/svg?seed=fallback`;

  // Handle invalid dates
  $: formattedTime = (() => {
    try {
      const ts = new Date(message?.when || Date.now());
      return ts.toLocaleTimeString();
    } catch (e) {
      return "(unknown time)";
    }
  })();
</script>

<div class={`message ${messageClass}`}>
  <img
    src={avatar}
    alt="avatar"
    on:error={(e) =>
      (e.target.src =
        "https://api.dicebear.com/6.x/adventurer/svg?seed=fallback")}
  />
  <div class="message-text">
    <p>{message?.what || "Message unavailable"}</p>
    <time>{formattedTime}</time>
  </div>
</div>
