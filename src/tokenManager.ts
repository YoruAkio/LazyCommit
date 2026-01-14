import * as vscode from "vscode"

/**
 * @note Manages GitHub token storage using VSCode SecretStorage
 */
export class TokenManager {
  private static readonly TOKEN_KEY = "commitGenerator.githubToken"
  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  /**
   * @note Save token to secure storage
   * @param token - GitHub personal access token
   */
  async saveToken(token: string): Promise<void> {
    await this.context.secrets.store(TokenManager.TOKEN_KEY, token)
  }

  /**
   * @note Get token from secure storage
   * @returns token string or undefined
   */
  async getToken(): Promise<string | undefined> {
    return await this.context.secrets.get(TokenManager.TOKEN_KEY)
  }

  /**
   * @note Delete token from secure storage
   */
  async deleteToken(): Promise<void> {
    await this.context.secrets.delete(TokenManager.TOKEN_KEY)
  }
}
