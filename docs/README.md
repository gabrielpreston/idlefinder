# Documentation Structure

This directory contains project documentation organized by implementation status.

## `current/`

Contains documentation for the **current MVP implementation**:

- `01-game-design-doc.md` - Game design overview
- `02-architecture-overview.md` - High-level architecture
- `03-data-and-persistence-design.md` - Data model and persistence
- `04-api-message-spec.md` - Message bus API specification
- `05-dev-guidelines.md` - Development guidelines
- `06-message-bus-architecture.md` - Message bus architecture details
- `07-authoritative-tech-spec.md` - **Authoritative technical specification** (primary reference)

These documents describe the current client-authoritative MVP implementation, though they may reference future considerations (server-authoritative model, Prisma, etc.).

## `future/`

Reserved for future planning documents:

- Server-authoritative migration plans
- Prisma/SQLite/remote DB implementation plans
- Multiplayer architecture
- Other future enhancements

Note: Future considerations are currently embedded in the current docs. As specific implementation plans are developed, they will be documented here.

