<script lang="ts">
  interface Message {
    role: "user" | "bot";
    content: string;
    timestamp: Date;
  }

  let inputMessage = "";
  let messages: Message[] = [];
  let isLoading = false;
  let errorMessage = "";

  function formatTimestamp(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  async function sendMessage() {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    messages = [...messages, { 
      role: "user", 
      content: userMessage,
      timestamp: new Date()
    }];
    inputMessage = "";
    isLoading = true;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }

      if (!data || !data.response) {
        throw new Error("Invalid response format from server");
      }

      let extractedResponse = data.response;

      try {
        extractedResponse = extractedResponse
          .replace(/<[Tt]hink(ing)?>[\s\S]*?<\/[Tt]hink(ing)?>/g, "")
          .replace(/<p>([\s\S]*?)<\/p>/g, "$1").trim()
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>")
          .replace(/__(.+?)__/g, "<u>$1</u>")
          .replace(/\s+/g, " ").trim();
      } catch (formatError) {
        console.error("Error formatting response:", formatError);
      }

      messages = [...messages, { 
        role: "bot", 
        content: extractedResponse,
        timestamp: new Date()
      }];
    } catch (error: any) {
      console.error("Error:", error);
      errorMessage = error.message || "Failed to get a response";
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function testConnection() {
    isLoading = true;
    errorMessage = "";
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test message" }),
      });
      
      const data = await response.json();
      console.log("API Response:", data);
      
      if (response.ok) {
        errorMessage = `API Connection Success: ${JSON.stringify(data)}`;
      } else {
        errorMessage = `API Error: ${data.error || response.statusText}`;
      }
    } catch (error) {
      console.error("Connection test error:", error);
      errorMessage = `Connection Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="chat-container">
  <header>
    <h1>Chat with Zette</h1>
    <div class="avatar">Z</div>
  </header>

  {#if errorMessage}
    <div class="error-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{errorMessage}</span>
      <button class="close-btn" on:click={() => errorMessage = ""}>×</button>
    </div>
  {/if}

  

  <div class="messages-container">
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">💬</div>
        <p>Start a conversation with Zette!</p>
        <p class="empty-suggestion">Try asking about her favorite games or hobbies</p>
      </div>
    {:else}
      {#each messages as message}
        <div class="message {message.role}">
          {#if message.role === "bot"}
            <div class="avatar small">Z</div>
          {/if}
          <div class="message-bubble">
            <div class="message-content">
              {@html message.content}
            </div>
            <!-- Add timestamp display -->
            <div class="message-timestamp">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      {/each}
    {/if}

    {#if isLoading}
      <div class="message bot">
        <div class="avatar small">Z</div>
        <div class="message-bubble">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="input-container">
    <textarea 
      bind:value={inputMessage} 
      placeholder="Type your message here..." 
      rows="2"
      on:keydown={handleKeydown}
      disabled={isLoading}
    ></textarea>

    <button on:click={sendMessage} disabled={isLoading || !inputMessage.trim()}>
      {#if isLoading}
        <span class="loading-spinner"></span>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f8f0fa;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
  }

  .chat-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100vh;
    box-sizing: border-box;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    position: relative;
  }

  h1 {
    text-align: center;
    margin: 0;
    color: #333;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #9c27b0;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.5rem;
    position: absolute;
    right: 0;
    box-shadow: 0 2px 10px rgba(156, 39, 176, 0.3);
  }

  .avatar.small {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    margin-right: 8px;
  }

  .error-banner {
    background-color: #ffebee;
    color: #d32f2f;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    animation: slideIn 0.3s ease-out;
  }

  .error-banner svg {
    flex-shrink: 0;
  }

  .error-banner span {
    flex: 1;
  }

  .close-btn {
    background: none;
    border: none;
    color: #d32f2f;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .debug-panel {
    margin-bottom: 16px;
    display: flex;
    justify-content: center;
  }
  
  .test-button {
    background-color: #ff9800;
    width: auto;
    height: auto;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .test-button:hover {
    background-color: #f57c00;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
    padding: 20px;
    border-radius: 12px;
    background-color: white;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }

  .empty-state {
    text-align: center;
    color: #666;
    margin: auto 0;
    padding: 40px 0;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 10px;
  }

  .empty-suggestion {
    font-size: 0.9rem;
    color: #999;
    margin-top: 8px;
  }

  .message {
    display: flex;
    align-items: flex-start;
    max-width: 85%;
  }

  .message.user {
    align-self: flex-end;
    justify-content: flex-end;
  }

  .message.bot {
    align-self: flex-start;
  }

  .message-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    position: relative; /* For timestamp positioning */
  }

  .message.user .message-bubble {
    background-color: #9c27b0;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .message.bot .message-bubble {
    background-color: #f0f0f0;
    color: #333;
    border-bottom-left-radius: 4px;
  }

  .message-content {
    word-break: break-word;
    line-height: 1.4;
  }

  .message-content :global(strong) {
    font-weight: 600;
  }

  /* Style for the timestamp */
  .message-timestamp {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 4px;
    text-align: right;
  }

  .message.user .message-timestamp {
    color: rgba(255, 255, 255, 0.8);
  }

  .message.bot .message-timestamp {
    color: #777;
  }

  .input-container {
    display: flex;
    gap: 10px;
    background-color: white;
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }

  textarea {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    font-family: inherit;
    font-size: 1rem;
    resize: none;
    background-color: #f9f9f9;
    transition: border-color 0.2s;
  }

  textarea:focus {
    outline: none;
    border-color: #9c27b0;
    box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
  }

  button {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #9c27b0;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    box-shadow: none;
  }

  button:hover:not(:disabled) {
    background-color: #7b1fa2;
  }

  button:active:not(:disabled) {
    transform: scale(0.95);
  }

  .typing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    background-color: #9c27b0;
    border-radius: 50%;
    display: inline-block;
    animation: bounce 1.4s infinite ease-in-out;
    opacity: 0.7;
  }

  .typing-indicator span:nth-child(1) {
    animation-delay: 0s;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-6px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 600px) {
    .chat-container {
      padding: 12px;
      height: 100vh;
    }

    .messages-container {
      padding: 15px;
    }

    .message {
      max-width: 90%;
    }

    h1 {
      font-size: 1.5rem;
    }

    .avatar {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
    }
  }
</style>
