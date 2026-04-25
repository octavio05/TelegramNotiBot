# AimHarderAutoBooking

## Docker execution

1. Create the .env.development or .env.production file.
2. Run the command `pnpm run build:docker:development` or `pnpm run build:docker:production`.
3. Run the command `pnpm run start:development` or `pnpm run start:production`.

## Local execution

1. Create the .env.local file.
2. Execute `pnpm install`.
3. Run the command `pnpm run start:db:local`.
4. Run the command `pnpm run start:local`.

## Environment Variables

| Name | Description | Type |
|------|-------------|------|
| DB_HOST | *localhost* for local execution. *couchdb-autobookings* for docker execution. | String |
