# KARLOLEGEND Desktop Roadmap

## 0.2 — foundation
- compile fix;
- filesystem desktop;
- hidden `.karlo` state;
- Feature Center;
- local feature package mechanism;
- local self-update mechanism;
- documentation.

## 0.3 — runtime hygiene + online updates
- single-instance enforcement;
- hide shell executable and Windows volume infrastructure;
- automatic GitHub Release discovery/download;
- in-app install/restart;
- bootstrap/update manifest compatibility fix.

## 0.4 — desktop ownership
- internal HTML viewer;
- WebView2 state contained in `.karlo`;
- wallpaper;
- desktop context menu;
- chrome-free F11 mode;
- free icon positioning;
- persistent icon coordinates;
- native rename;
- recycle-bin delete;
- item context actions;
- updater previous-version backup;
- cross-agent repository context;
- concrete desktop/update specifications;
- separate CI and explicit release pipeline.

## 0.5 — desktop interaction depth
- snap-to-grid UI toggle;
- icon scale UI;
- multi-selection and rubber-band selection;
- keyboard spatial navigation;
- drag/drop file operations;
- create-item palette;
- internal image + Markdown/text viewers;
- per-directory presentation profiles;
- optional auto-arrange/sort commands.

## 0.6 — local version control
- Git detection/bootstrap;
- local repository registry;
- status surface;
- stage/unstage;
- commit;
- timeline;
- diff;
- branches and tags;
- restore;
- optional backup remote.

## 0.7 — update hardening
- stable channel manifest;
- updater/package schema versions;
- post-update health check;
- automatic rollback;
- append-only update history;
- release signatures;
- clear stable/preview channels.

## 0.8 — feature runtime
- stable feature API;
- capability manifest;
- install/enable/disable/update;
- signature/trust verification;
- feature crash isolation where practical.

## 1.0
- shell is stable enough to be the default KARLOLEGEND workspace UI;
- source remains independent on C:;
- deployed app and state remain on K:;
- user data remains standard filesystem data;
- supported content types feel native inside KARLOLEGEND without trapping the underlying files;
- updates are recoverable and do not require manual release downloads.
