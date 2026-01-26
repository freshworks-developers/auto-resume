# Auto-Resume: Rate Limit Handling for Freshworks Platform 3.0

Automatically handle API rate limits (HTTP 429) in long-running batch operations. When rate limits interrupt your process, this app automatically pauses and resumes from exactly where it stopped—no manual intervention required.

## What It Does

Process thousands of records without worrying about rate limits. The app detects HTTP 429 errors, schedules an automatic resume, and continues processing seamlessly until completion.

**Perfect for**: Bulk ticket creation, data imports, batch updates, migrations, and any large-scale Freshdesk operations.

## How It Works

1. **Detects** rate limits (HTTP 429) during batch operations
2. **Pauses** and schedules a resume event with continuation data
3. **Resumes** automatically from the last successful record
4. **Completes** the entire operation without manual intervention

## Key Features

- ✅ Automatic resume on rate limits
- ✅ State preservation (no duplicate processing)
- ✅ Error differentiation (rate limits vs. fatal errors)
- ✅ Configurable delay between retries

## Quick Start

```bash
git clone <repository>
cd auto-resume
fdk run
```

Configure your Freshdesk API credentials through the FDK interface. See `USECASE.md` for real-world scenarios.

## Tech Stack

- **Platform**: Freshworks Platform 3.0
- **Runtime**: Node.js 18.20.8
- **FDK**: 9.7.4

## Platform Features Demonstrated

- Serverless Method Invocation (SMI)
- Scheduled Events for resume logic
- Request Templates for API calls
- Event Handlers (onScheduledEvent)

## Use Cases

Ideal for scenarios requiring:
- Bulk data imports and migrations
- Large-scale ticket operations
- API synchronization
- Batch processing of thousands of records

See `USECASE.md` for detailed Klipkart use cases including Big Million Day event handling.
