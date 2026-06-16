Use Cases - Klipkart / Auto-Resume
===================================

Company Overview
----------------

**Klipkart** is an e-commerce platform using **Freshdesk** for customer support operations. During peak sale events and large-scale migrations, support operations must create or update tens of thousands of tickets without manual intervention when API rate limits are hit.

* * * * *

Use Case Scenarios
------------------

### 1\. Big Million Day Event

**Scenario**: During Klipkart's annual Big Million Day sale, over 500,000 support tickets are created within 48 hours. Standard API calls hit Freshdesk rate limits within minutes.

**Use Case**: Auto-Resume processes tickets in batches via Request Templates. On HTTP 429, it saves the current cursor to `$db`, schedules a deferred resume job, and continues automatically after the rate-limit window resets — ensuring every customer inquiry is captured during the sale.

* * * * *

### 2\. Bulk Ticket Creation

**Scenario**: Klipkart launches a product recall campaign requiring support tickets for 50,000 affected customers.

**Use Case**: The app creates tickets in manageable chunks from the sidebar via SMI. When rate limits interrupt the run, processing pauses and resumes from the stored checkpoint without duplicating already-created tickets.

* * * * *

### 3\. Bulk Contact Import

**Scenario**: Klipkart imports 20,000 customer contacts from an external CRM into Freshdesk to give agents full customer history.

**Use Case**: The same pause-and-resume engine applies to contact import batches. Progress persists in `$db` so a network blip or 429 response does not force operators to restart from record one.

* * * * *

### 4\. Bulk Ticket Updates

**Scenario**: During a system migration, Klipkart must update priority and assignment on 15,000 open tickets.

**Use Case**: Batch update operations use the identical checkpoint pattern. Scheduled events re-awaken the job after rate limits clear, and the cursor ensures each ticket is updated exactly once.

* * * * *

### 5\. Historical Data Migration

**Scenario**: Klipkart migrates five years of support history — over 100,000 tickets — from a legacy system into Freshdesk.

**Use Case**: Auto-Resume serves as the migration engine for multi-hour runs. Self-healing resume logic manages API breathing room across rate-limit cycles, allowing unattended migration without operator babysitting.
