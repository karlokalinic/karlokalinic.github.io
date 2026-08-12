# Local Version Control — GitHub Without Collaboration

## Goal

Reproduce the useful single-user mental model of GitHub while removing the hosting/social/collaboration product.

KARLOLEGEND should eventually provide:

- repository list;
- working-tree status;
- staged/unstaged changes;
- visual diffs;
- commit creation;
- history/timeline;
- branches;
- tags;
- file history;
- restore/revert;
- repository snapshots;
- optional backup remotes.

It does not need:

- pull requests;
- issue tracking;
- code review;
- team permissions;
- stars/follows;
- organization management;
- discussions;
- social discovery.

## Engine decision

Use **Git** as the underlying version-control engine.

Do not initially reimplement Git internals.

Reasons:

- content-addressed history is already solved;
- branch and merge semantics are already solved;
- repository recovery remains possible outside KARLOLEGEND;
- standard tooling remains compatible;
- `.git` is local and does not require GitHub.

KARLOLEGEND replaces the interface and workflow, not the proven storage model.

## Proposed local model

    K:\.karlo\vcs\
      repositories.json
      backups.json
      ui-state.json

Each actual project remains a standard repository:

    K:\Projects\Game\.git\
    K:\Writing\Drama\.git\

The registry only remembers which repositories should appear in the KARLOLEGEND Version Control screen.

## Planned screens

### Repositories
Local equivalent of a GitHub repository dashboard.

### Changes
Changed, new, deleted and staged files.

### Commit
Message + selected changes.

### Timeline
Chronological commits with author/date/message.

### Diff
Side-by-side and unified views.

### Branches
Create, switch, rename, delete.

### Restore
Restore a file, directory or entire working tree to a selected commit.

### Backup
Optional push to:
- another local disk;
- a bare repository;
- network storage;
- GitHub/GitLab/other remote only if explicitly configured.

## Philosophy

The canonical project is local.

A remote is backup/synchronization, not the identity of the project.
