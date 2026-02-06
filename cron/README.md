# Cron: checkDueTasks

Purpose
- Runs a scheduled job that finds tasks with due dates within the last hour, emails the task owner, and optionally deletes or marks the task as notified.
- Implemented in `server/cron/checkDueTasks.js` and loaded by the server at startup.

Default behavior
- Runs hourly by default.
- Verifies DB connectivity before running.
- Uses retry/backoff when sending emails and prevents overlapping runs.

Environment variables
- `CRON_SCHEDULE` (string)
  - Cron expression used by `node-cron`.
  - Default: `0 * * * *` (at minute 0 each hour)
  - Example: `*/5 * * * *` to run every 5 minutes.

- `DELETE_AFTER_EMAIL` (true|false)
  - If `true` (default) the script deletes a task after a successful email send.
  - If `false`, the script will update the task status to `notified` instead of deleting.

- `CRON_MAX_RETRIES` (integer)
  - Number of retry attempts for sending an email (exponential backoff).
  - Default: `3`.

- `RUN_CRON_ON_STARTUP` (true|false)
  - If `true`, runs the `checkDueTasks` function once immediately on process start (useful for containerized deployments).
  - Default: `false`.

Notes about behavior
- The job checks for tasks with `dueDate` between (now - 1 hour) and now and `status` not equal to `completed`.
- If the database is unavailable, the job logs the error and skips that run (it will try again on the next scheduled tick).
- Concurrency guard (`isRunning`) prevents overlapping executions when a previous run is still in progress.
- Email sending uses retries with exponential backoff; after `CRON_MAX_RETRIES` it logs a failure.

How to configure
1. Add the variables to your server `.env` (or set them in your environment). Example:

```bash
# server/.env
CRON_SCHEDULE="0 * * * *"        # hourly
DELETE_AFTER_EMAIL=true
CRON_MAX_RETRIES=3
RUN_CRON_ON_STARTUP=false
```

2. Restart the server so the cron module is loaded by the app:

```bash
cd server
npm run dev
```

Quick testing
- To force an immediate run for testing, enable startup run and restart:

```bash
export RUN_CRON_ON_STARTUP=true
# or add RUN_CRON_ON_STARTUP=true to server/.env
npm run dev
```

- Manually create a task in the DB with a `dueDate` within the last hour and a linked user with an `email` to verify behavior.
- Watch logs (the app uses `pino`/`pino-pretty`) for entries like `⏰ Checking for due tasks...` and `📧 Email sent for task:`.

Logging
- Uses `server/utils/logger.js` (pino) — check stdout for logs during development.

Safety & production tips
- Ensure mailer credentials and DB credentials are set in production env securely.
- Consider setting `DELETE_AFTER_EMAIL=false` in production if you prefer not to delete records automatically.
- Adjust `CRON_SCHEDULE` to reduce load in high-scale environments.

File
- Implementation: `server/cron/checkDueTasks.js`
