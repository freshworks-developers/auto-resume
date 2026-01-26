# Rate Limit Handling with Scheduled Events - Freshworks Platform 3.0

A demonstration app showcasing how to handle API rate limits (HTTP 429) in Freshworks Platform 3.0 serverless functions using Scheduled Events. The app uses ticket generation as a simulation to demonstrate the rate limit handling pattern.

## Overview

This app demonstrates a robust pattern for handling API rate limits in long-running batch operations. When an API call encounters an HTTP 429 rate limit error, the app automatically schedules a resume event that continues the operation after a delay, ensuring completion without manual intervention.

**Use Case**: Demonstrating rate limit handling with Scheduled Events  
**Simulation**: Ticket generation (not the actual use case)

## Core Pattern

The app implements a rate limit handling pattern that:

1. ✅ **Detects Rate Limits**: Monitors API responses for HTTP 429 status codes
2. ✅ **Schedules Resume**: Creates a Scheduled Event with continuation data (runId, nextIndex, total)
3. ✅ **Resumes Automatically**: Scheduled event handler continues from the last successful index
4. ✅ **Prevents Duplicates**: Checks for existing schedules before creating new ones
5. ✅ **Handles Errors**: Distinguishes between rate limits (resumable) and other errors (stop)

## Architecture

### Serverless Functions

- **`start_generation`**: Entry point that initiates a batch operation and generates a unique runId
- **`generateBatch`**: Core batch processing logic that handles rate limits and schedules resume events
- **`onScheduledEventHandler`**: Processes scheduled events to resume interrupted batch operations

### Rate Limit Flow

1. Batch operation starts processing items sequentially
2. On HTTP 429 response: Operation stops, schedule created with 7-minute delay
3. Schedule payload includes: runId, total count, and nextIndex (where to resume)
4. Scheduled event fires after delay
5. Handler resumes batch from nextIndex
6. Process repeats until all items are processed

### Key Features

- ✅ **Automatic Resume**: No manual intervention required when rate limited
- ✅ **State Preservation**: Tracks progress via runId and nextIndex
- ✅ **Duplicate Prevention**: Checks for existing schedules before creating new ones
- ✅ **Error Differentiation**: Only schedules on rate limits (429), stops on other errors
- ✅ **Configurable Delay**: 7-minute delay between resume attempts (configurable)

## Tech Stack

- **Platform**: Freshworks Platform 3.0
- **Runtime**: Node.js 18.20.8
- **FDK**: 9.7.4
- **Pattern**: Scheduled Events for rate limit handling

## Quick Start

### Prerequisites

- Node.js 18.20.8+
- FDK 9.7.4+
- Freshdesk account with API access (for simulation)

### Installation

Clone the repository and install dependencies. Run the app locally using FDK.

### Configuration

Configure system settings and API credentials through the FDK local development interface. The app requires a Freshdesk API key for the ticket generation simulation.

## Project Structure

```
.
├── manifest.json              # Platform 3.0 configuration
├── app/                       # Frontend UI (ticket sidebar)
├── server/
│   ├── server.js             # Serverless functions & rate limit handlers
│   └── test_data/            # Test payloads for scheduled events
└── config/                    # Request templates & installation parameters
```

## Key Components

### Rate Limit Detection

The app monitors API responses and distinguishes between:
- ✅ **Rate Limit (429)**: Resumable - schedules resume event
- ✅ **Other Errors (400, 401, 500)**: Non-resumable - stops operation

### Schedule Management

- ✅ **Unique Naming**: Schedule names include runId and index to prevent conflicts
- ✅ **Existence Check**: Verifies schedule doesn't already exist before creating
- ✅ **Payload Structure**: Includes all necessary data to resume operation

### Resume Logic

The scheduled event handler:
- ✅ Validates incoming payload (runId, ticketCount, nextIndex)
- ✅ Resumes batch processing from nextIndex
- ✅ Continues until completion or next rate limit

## Testing

Test the rate limit handling pattern locally using FDK's test interface. Simulate scheduled events using the test payloads provided in the `server/test_data` directory.

## Platform 3.0 Features Demonstrated

- ✅ Serverless Method Invocation (SMI)
- ✅ Scheduled Events for resume logic
- ✅ Request Templates for API calls
- ✅ Event Handlers (onScheduledEvent)
- ✅ Error handling and retry patterns

## Use Cases

This pattern is applicable to any scenario requiring:
- ✅ Long-running batch operations
- ✅ API rate limit handling
- ✅ Automatic resume after delays
- ✅ State preservation across interruptions

Examples: Bulk data imports, API synchronization, batch processing, data migration.