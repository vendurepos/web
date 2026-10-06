# web
Website and documentation for VendurePOS

## Changelog page

`content/docs/changelog.mdx` (served at `/docs/changelog`) carries the released
entries of `packages/vendure-plugin/CHANGELOG.md` from vendurepos/app, newest first.
At each plugin release (a `plugin-v*` tag and an npm publish of
`@vendurepos/plugin`), copy the new version's section from that file on `main`, with
its release date, to the top of the page. Never copy an `(unreleased)` section.

## Feature claims

Every entry in the home page's `features` and `demoParity` lists sits under a
`//` comment naming the vendurepos/app test that proves it, and
`tests/features.test.mjs` fails when one is missing. Add a feature only once it
is merged in vendurepos/app with a test, and leave out what its README lists
under "Known limitations".
