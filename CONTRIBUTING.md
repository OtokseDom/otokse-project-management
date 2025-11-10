# Contributing to Otokse Project Management

Thank you for your interest in contributing! We welcome all kinds of contributions, including bug reports, feature requests, documentation improvements, and code submissions.

## Getting Started

1. **Fork the repository** - Click the "Fork" button on the top-right of the repository page
2. **Clone your fork** - `git clone https://github.com/YOUR-USERNAME/otokse-project-management.git`
3. **Create a new branch** - `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-fix-name`
4. **Make your changes** - Implement your feature or bug fix
5. **Commit your changes** - `git commit -m "type(scope): description"` (see commit guidelines below)
6. **Push to your fork** - `git push origin your-branch-name`
7. **Submit a Pull Request** - Open a PR against the `main` branch

## Commit Message Guidelines

We follow conventional commit messages:

```
type(scope): description

Optional body with more details
Optional footer with references
```

### Types:
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring without feature changes
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies, etc.

### Examples:
- `feat(tasks): add task filtering by date range`
- `fix(kanban): resolve drag-and-drop issue on Firefox`
- `docs(readme): update installation instructions`

## Code Style

### Frontend (React)
- Use functional components with hooks
- Use ES6+ syntax
- Follow the existing code structure
- Add comments for complex logic

### Backend (Laravel)
- Follow PSR-12 coding standards
- Use meaningful variable and method names
- Add type hints where possible
- Write tests for new features

## Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Include both unit and integration tests where applicable

## Pull Request Process

1. Update the README.md if needed
2. Reference any related issues (e.g., "Fixes #123")
3. Provide a clear description of your changes
4. Ensure your code follows our style guidelines
5. Request a review from maintainers

## Reporting Issues

When opening an issue, please include:
- A clear title describing the problem
- Steps to reproduce (for bugs)
- Expected behavior vs. actual behavior
- Screenshots or error logs if applicable
- Your environment (OS, browser, etc.)

## Feature Requests

Feature requests are welcome! Please include:
- A clear description of the feature
- Why it would be useful
- Any alternative solutions you've considered

## Questions?

Feel free to open an issue or discussion if you have questions about contributing.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

Thank you for contributing! 🌟
