<div align="center">

# LazyCommit

**Too lazy to write commit messages? Let AI do it for you.**

</div>

---

## Features

- Generate commit messages from staged changes using GitHub Models AI
- Three commit format styles: **Default**, **Simple**, and **Short**
- Multiple AI model selection (GPT-4o, GPT-4o Mini, GPT-4.1, etc.)
- Secure token storage using VSCode SecretStorage
- One-click generation from SCM title bar

## Installation

### From VSIX (Recommended)

1. Go to [Releases](https://github.com/YoruAkio/LazyCommit/releases) page
2. Download the latest `.vsix` file
3. Open VSCode
4. Open command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
5. Type `Extensions: Install from VSIX...`
6. Select the downloaded `.vsix` file
7. Reload VSCode when prompted

### From Source

```bash
git clone https://github.com/YoruAkio/LazyCommit.git
cd LazyCommit
bun install
bun run compile
bun run package
```

Then install the generated `.vsix` file using the steps above.

## Setup

1. On first use, you'll see a notification to configure your GitHub token
2. Click **"Get Token"** to open [GitHub PAT Fine-Grained creation page](https://github.com/settings/personal-access-tokens/new?user_models=read), or **"Input Token"** to enter existing token
3. Create a token with `model:read` scope
4. Paste the token when prompted

## Usage

1. Stage your changes in Git
2. Click the sparkle icon in the Source Control title bar
3. The generated commit message will appear in the commit input box

## Commands

Open command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and type "LazyCommit":

| Command | Description |
|---------|-------------|
| `LazyCommit: Generate Commit Message` | Generate commit message from staged changes |
| `LazyCommit: Input GitHub Token (PAT Fine-grained)` | Enter your GitHub token |
| `LazyCommit: Get GitHub Token` | Open GitHub page to create a new token |
| `LazyCommit: Select AI Model` | Choose AI model for generation |
| `LazyCommit: Select Commit Style` | Switch between default, simple, and short style |

## Github Models Rate Limit Information

For more information on rate limits, see [GitHub's documentation](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models#rate-limits).

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `lazycommit.commitFormat` | Commit format style (`default`, `simple`, or `short`) | `default` |
| `lazycommit.model` | GitHub Models AI model to use | `gpt-4o-mini` |

### Available Models

- GPT-4o Mini (fast and efficient)
- GPT-4o (most capable)
- GPT-4.1 (latest version)
- GPT-4.1 Mini (balanced)
- GPT-4.1 Nano (lightweight)
- o4 Mini (optimized)

### Commit Formats

**Default** - Includes scope:
```
feat(auth): implement complete authentication flow

- add JWT refresh token rotation
- implement password reset API
- add login rate limiting
```

**Simple** - No scope:
```
feat: implement checkout improvements

- add promo code validation
- fix cart quantity sync
- add order confirmation email
```

**Short** - One line with semicolons:
```
feat: add login; fix validation; update UI
```

## Requirements

- VSCode 1.85.0 or higher
- GitHub Personal Access Token (Fine-grained token) with `model:read` scope

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
