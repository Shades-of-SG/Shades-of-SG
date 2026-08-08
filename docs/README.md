# Shades of SG documentation

Last updated: 8 August 2026

This index separates current project documentation from historical evidence. The implementation, Sequelize models, and ordered SQL migrations remain the source of truth.

## Current project documents

- [High-level design](project/HIGH_LEVEL_DESIGN.md)
- [Implementation status and phases](project/PROJECT_IMPLEMENTATION_PHASE.md)
- [Use-case specification](project/USE_CASE_SPECIFICATION.md)
- [Feature ownership specification](project/OWNERSHIP_SPECIFICATION.md)
- [Database schema overview](project/DATABASE_SCHEMA_OVERVIEW.md)
- [Frontend route inventory](reference/ROUTE_INVENTORY.md)

## Operational guides

- [Authentication setup](guides/AUTHENTICATION_SETUP.md)
- [Playwright testing](guides/PLAYWRIGHT_TESTING.md)

## Audits and integration evidence

- [Multi-creator isolation audit](audits/MULTI_CREATOR_ISOLATION_AUDIT.md)
- [Public Task 1 safe integration report](audits/PUBLIC_TASK_1_SAFE_INTEGRATION_REPORT.md)

## Planning records

These files explain earlier decisions but do not override the current project documents.

- [Phase 0 progress](planning/PHASE_0_PROGRESS.md)
- [Original frontend scaffold specification](planning/FRONTEND_SCAFFOLD_SPECIFICATION.md)

## AI development journals

Attribution and individual records are preserved without consolidation or rewriting.

- [Team AI development journal](journals/TEAM_AI_DEVELOPMENT_JOURNAL.md)
- [Ferlyn's journal](journals/ferlyn/AI_ASSISTED_DEVELOPMENT_JOURNAL.md)
- [Lia's journal](journals/lia/AI_JOURNAL.md), [reflection](journals/lia/AI_REFLECTION.md), and [Claude logs](journals/lia/claude-logs/README_FIRST.md)
- [Shermaine's journal](journals/shermaine/AI_DEVELOPMENT_JOURNAL.md)

## Archive

The [archive](archive/) preserves detailed workflow history and the original creator/public use-case documents. They contain superseded routes and planned features and are retained as submission evidence, not current specifications.

## Local generated artifacts requiring team review

`final-combined-merge-backup.patch` and `final-combined-staged-backup.patch` are ignored recovery artifacts at the repository root. They were not moved or deleted because their continued submission value needs team confirmation.
