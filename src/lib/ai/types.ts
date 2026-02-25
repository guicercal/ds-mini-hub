/**
 * Formatted message interface representing generic chat history 
 * agnostic to the LLM backend.
 */
export interface Message {
    /** The role of the sender (e.g., CUSTOMER, HUMAN_AGENT, AI_AGENT) */
    senderType: string
    /** The actual content text of the message */
    text: string
}

/**
 * Standard contract for any AI Provider resolving suggestion logic.
 * Every new AI strategy must implement this boundary.
 */
export interface AiProvider {
    /**
     * Generates a suggested response based on the conversation history.
     * 
     * @param {Message[]} messages - Ordered history of past conversation messages.
     * @returns {Promise<string>} The final message output to be proposed to the user.
     */
    generateSuggestion(messages: Message[]): Promise<string>
}
