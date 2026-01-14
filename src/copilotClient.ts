interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface OpenAIChatCompletion {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * @note GitHub Copilot API client for generating commit messages
 */
export class CopilotClient {
  private token: string
  private model: string
  private baseURL = "https://models.github.ai"

  constructor(token: string, model: string) {
    this.token = token
    this.model = model
  }

  /**
   * @note Validate the GitHub token by making a test request
   * @returns true if token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/catalog/models`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * @note Generate commit message using GitHub Copilot
   * @param systemPrompt - The system prompt for commit format
   * @param changes - The staged git diff
   * @returns Generated commit message
   */
  async generateCommitMessage(
    systemPrompt: string,
    changes: string
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: changes,
      },
    ]

    const response = await fetch(
      `${this.baseURL}/inference/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 256,
          top_p: 0.95,
          stream: false,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`GitHub API Error (${response.status}): ${error}`)
    }

    const data = (await response.json()) as OpenAIChatCompletion

    const message = data.choices[0]?.message?.content
    if (!message) {
      throw new Error("No response received from GitHub Copilot")
    }

    return message.trim()
  }
}
