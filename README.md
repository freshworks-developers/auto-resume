
Auto-Resume: Rate Limit Resiliency Engine
=========================================

An enterprise-grade reference implementation for handling high-volume operations on Freshworks Platform 3.0. This app provides a self-healing mechanism for batch processes by automatically navigating HTTP 429 (Rate Limit) constraints through state-managed resume logic.

* * * * *

🚀 Architectural Overview
-------------------------

When executing large-scale operations, API rate limits are an expected constraint. This engine eliminates manual retry overhead by implementing a "Pause-and-Resume" state machine.

### Logic Flow

1.  **Execution**: The app initiates a bulk operation (e.g., Ticket Creation).

2.  **Detection**: Intercepts `429 Too Many Requests` status codes via Request Templates.

3.  **Persistence**: Saves the current cursor/index and remaining payload to the Platform Database ($db$).

4.  **Rescheduling**: Triggers a `onScheduledEvent` to re-awaken the process after the rate-limit reset window.

5.  **Recovery**: Resumes processing from the exact checkpoint without data duplication.

* * * * *

🔗 Feature to Implementation Mapping
------------------------------------

| **Functionality** | **Platform Module** | **Engineering Rationale** |
| --- | --- | --- |
| **Fault Tolerance** | Request Templates | Intercepts HTTP 429 status globally to trigger backoff logic. |
| **State Recovery** | Data API ($db$) | Stores the "last successful record" index to prevent duplicate entity creation. |
| **Deferred Execution** | Scheduled Events | Offloads the wait-time to the platform scheduler, freeing up active runtime. |
| **Secure Handshake** | SMI | Encapsulates heavy batch logic in a secure, server-side environment. |

* * * * *

🛠 Tech Stack
-------------

-   **Platform:** Freshworks Platform v3.0

-   **Runtime:** Node.js 18.20.8

-   **FDK Version:** 9.7.4

-   **Key APIs:** SMI, $db$, Scheduled Events, Request Templates

* * * * *

📋 Use Case Scenarios (High-Volume)
-----------------------------------

| **Scenario** | **Application** |
| --- | --- |
| **Peak Events** | Handling 500k+ tickets during flash sales (e.g., Klipkart's Big Million Day). |
| **Data Migration** | Moving 5+ years of historical support data into Freshdesk. |
| **Sync Operations** | Importing 50k+ customer contacts from external CRMs. |
| **Bulk Updates** | Re-assigning thousands of tickets during organizational restructuring. |

* * * * *

⚡ Quick Start
-------------

### 1\. Installation

Bash

```
git clone <repository-url>
cd auto-resume
npm install

```

### 2\. Configuration

Define your rate-limit thresholds and API credentials in `config/iparams.json`.

### 3\. Execution

Bash

```
fdk run

```

*Append `?dev=true` to your Freshdesk URL to test the SMI triggers and resume logic in real-time.*

* * * * *

⚠️ Constraints & Considerations
-------------------------------

-   **Retention:** Mapping data in `$db` is purged after successful completion to stay within storage limits.

-   **Scheduling:** Minimum schedule interval is 5 minutes as per platform guidelines.

-   **Payload Size:** Large batch arrays are segmented to fit within the 100KB `$db` value limit.

* * * * *

Use Cases
-------------------------------

Ideal for scenarios requiring:
- Bulk data imports and migrations
- Large-scale ticket operations
- API synchronization
- Batch processing of thousands of records

See `USECASE.md` for detailed Klipkart use cases including Big Million Day event handling.
