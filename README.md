Hint Hub
Hint Hub is a powerful, private developer tool designed to accelerate programming workflows and foster learning. Whether you're tackling algorithm challenges, debugging application code, or seeking optimized solutions, Hint Hub provides step-by-step hints, curated code snippets, and smart guidance—all in one place.

At its core, Hint Hub enables developers to break down complex problems, explore alternative solutions, and sharpen their skills by unveiling just enough guidance when needed. The platform is especially valuable for teams working on internal projects, coding bootcamps, or anyone seeking to elevate their problem-solving abilities in a secure and collaborative environment.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Hint-Hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
The application is configured to use OpenRouter API with a pre-configured API key. No additional environment variables are required.

**Note:** The application uses OpenRouter API with Claude 3.5 Sonnet model for AI-powered code analysis and suggestions.

### 4. Start the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Technologies Used
Hint Hub is built using the following technologies:

- **Vite**: Fast development environment and build tool.
- **TypeScript**: Typed superset of JavaScript for safer code.
- **React**: Library for building modern user interfaces.
- **shadcn-ui**: Collection of accessible, customizable UI components.
- **Tailwind CSS**: Utility-first CSS framework for quick, consistent styling.
- **OpenRouter API**: AI-powered code analysis and suggestions using Claude 3.5 Sonnet.

Key Features
Code Space for Suggestions: Paste your code directly into the interactive code space and receive intelligent suggestions, including best practices, bug detections, and optimization tips.

Curated Coding Hints & Steps: Access comprehensive, progressive hints that guide you through intricate problems without giving away the full solution at once.

Ready-to-Use Code Snippets: Benefit from a repository of verified code snippets for common problems, which can be copied and integrated into your own workflow.

Smart Search & Filtering: Find hints, solutions, or code reviews using robust search and filtering tools by language, topic, or difficulty.

(Private) Collaboration: Collaborate securely with team members, sharing hints or reviewing code in a trusted environment.

Example Use Case
Paste your code: Use the built-in code space to input your current function or script.

Get instant suggestions: Receive on-the-fly feedback, such as syntax corrections, optimization hints, or alternative approaches.

Request a hint: If you’re stuck, unlock tailored hints that nudge you in the right direction—no spoilers unless you ask for the full solution!

Why Hint Hub?
Boost Productivity: Reduce time spent stuck on bugs or design decisions with actionable, context-aware advice.

Improve Code Quality: Leverage automated suggestions to catch issues early and learn best practices.

Safe & Private: All data, hints, and interactions remain within your authorized team.

How to Contribute or Edit Files
There are two main ways to edit files in this project:

Edit a File Directly in GitHub
Navigate to the desired file in the repository.

Click the "Edit" button (pencil icon) at the top right of the file view.

Make your changes.

Commit and save the changes directly from the GitHub web interface.

Use GitHub Codespaces
On the main page of your repository, click the "Code" button (green button).

Select the "Codespaces" tab.

Click "New codespace" to launch a dedicated development environment.

Edit files directly within Codespaces, then commit and push your changes when done.
