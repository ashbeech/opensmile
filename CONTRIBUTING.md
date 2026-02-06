# Contributing to OpenSmile

First off, thank you for considering contributing to OpenSmile! It's people like you who make this platform better for dental practices everywhere.

## Code of Conduct

Be respectful, be constructive, be kind. We're all here to build something useful.

## How Can I Contribute?

### Reporting Bugs

Found a bug? Please create an issue with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, browser, Node version)

### Suggesting Features

Have an idea? We'd love to hear it! Create an issue with:

- Clear description of the feature
- Why it would be useful
- How it might work
- Examples from other tools (if applicable)

### Code Contributions

1. **Fork the repository**
2. **Create a branch** (`git checkout -b feature/your-feature-name`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages** (`git commit -m 'Add: Brief description'`)
6. **Push to your fork** (`git push origin feature/your-feature-name`)
7. **Open a Pull Request**

## Development Setup

```bash
git clone https://github.com/yourusername/opensmile.git
cd opensmile
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npx prisma db push
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Prefer type inference over explicit types where clear
- Use Zod for runtime validation

### React Components

- Use functional components with hooks
- Keep components focused and reusable

### Database

- All schema changes go through Prisma migrations
- Use Prisma Client for all database access
- Add indexes for frequently queried fields

### API

- Use tRPC for all API endpoints
- Input validation with Zod
- Proper error handling

### Git Commits

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or tooling changes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
