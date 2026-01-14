<div align="center">

# AI Commit Message Generator

**Generate conventional commit messages using GitHub Copilot AI**

</div>

---

## Features

- Generate commit messages from staged changes using GitHub Copilot AI
- Two commit format styles: **Default** (with scope) and **Simple** (without scope)
- Supports single and multiple changes with bullet points
- Secure token storage using VSCode SecretStorage
- One-click generation from SCM title bar

## Installation

### From Source

```bash
git clone https://github.com/YoruAkio/VSCodeCommitGenerator.git
cd VSCodeCommitGenerator
bun install
bun run compile
bun run package
```

## Setup

1. On first use, you'll see a notification to configure your GitHub token
2. Click **"Get Token"** to open [GitHub PAT Fine-Grained creation page](https://github.com/settings/personal-access-tokens/new?user_models=read), or **"Input Token"** to enter existing token
3. Create a token with `model:read` scope
4. Paste the token when prompted

## Usage

1. Stage your changes in Git
2. Click the ✨ (sparkle) icon in the Source Control title bar
3. The generated commit message will appear in the commit input box

## Github Models Rate Limit Information

For more information on rate limits, see [GitHub's documentation](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models#rate-limits).

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `commitGenerator.commitFormat` | Commit format style (`default` or `simple`) | `default` |
| `commitGenerator.model` | GitHub Copilot model to use | `gpt-4o-mini` |

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

## Requirements

- VSCode 1.85.0 or higher
- GitHub Personal Access Token ( Fine-grained token ) with `model:read` scope

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
