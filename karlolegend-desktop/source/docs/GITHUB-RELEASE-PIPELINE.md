# GitHub Release Pipeline

Public release channel:

    karlokalinic/karlokalinic.github.io

Source mirror:

    karlolegend-desktop/source/

Repository workflow:

    .github/workflows/karlolegend-desktop-release.yml

A source push builds a Windows x64 self-contained executable and creates/refreshes a GitHub Release whose tag comes from `<Version>` in `KarloDiskShell.csproj`.

Release assets:

    KARLOLEGEND-vX.Y.Z.karloupdate
    KARLOLEGEND.exe

The production app queries GitHub's `releases/latest` API and downloads the `.karloupdate` asset itself.

## Release rule

Every user-visible update must increase:

    <Version>X.Y.Z</Version>

If code changes without a version increase, a client already reporting that same version will not install it as a newer release.

## Security rule

Never embed a GitHub PAT/token in KARLOLEGEND.exe.

The release channel is public so downloads remain anonymous.
