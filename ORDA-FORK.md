# Orda fork of Enatega Multi-Vendor

This is a long-lived fork of `enatega/food-delivery-multivendor` (MIT) used as
the frontend layer for the [Orda](https://github.com/Husseinahk/orda) restaurant
ordering platform.

## Branches

- `master` — clean upstream mirror, no Orda changes. Pull from `enatega:master`
  periodically.
- `orda-main` — **the working branch**. Holds:
  - `environment.js` customisations (per-customer backend host)
  - Apollo client config tweaks (auth header, error handling for our backend)
  - branding theming (per-customer build)
- `customer/<slug>` — per-deployment branches (one per restaurant) when the
  customisation is more than env vars. Branched from `orda-main`.

## What we DO NOT change in the fork

- `enatega-multivendor-app/src/apollo/queries.js`
- `enatega-multivendor-app/src/apollo/mutations.js`
- `enatega-multivendor-app/src/apollo/subscriptions.js`

These are the operation files. Touching them defeats the point of a backend
adapter, makes upstream merges painful, and produces a divergent fork. If a
backend query doesn't match Enatega's expected shape, **fix it in the
backend's GraphQL adapter** (see [orda#61](https://github.com/Husseinahk/orda/issues/61)),
not in this fork.

## What we DO change in the fork

- `environment.js` — point at the customer's backend host.
- `enatega-multivendor-app/src/apollo/index.js` — auth-header link, error
  link, anything our backend needs differently. Document deltas in commit
  messages so they survive upstream merges.
- Branding: app icon, splash screen, primary colour, theme.
- Removal of features the customer didn't pay for (driver app builds,
  multi-vendor browsing on a single-vendor deployment, etc.).

## Status (2026-05-15)

Branch `orda-main` created. Backend GraphQL adapter (orda#61) is in progress;
until Slice 1 lands, this fork cannot boot against the Orda backend. Track
slice progress in the
[Orda Enatega Integration doc](https://github.com/Husseinahk/orda/blob/main/docs/enatega-integration.md).

## Upstream

- Original repo: <https://github.com/enatega/food-delivery-multivendor>
- License: MIT — see `LICENSE`.
- Commercial Enatega offers a hosted backend; we replace it with our own .NET 10 backend.
