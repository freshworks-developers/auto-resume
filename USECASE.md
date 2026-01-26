# Use Cases - Klipkart

## Company Overview

**Klipkart** is an e-commerce platform using Freshdesk for customer support operations.

## Use Case Scenarios

### 1. Big Million Day Event

**Scenario**: During Klipkart's annual Big Million Day sale, millions of customers place orders, generating over 500,000 support tickets in Freshdesk within 48 hours. The support team needs to create tickets, assign priorities, and route them to appropriate agents based on order value and customer tier.

**Use Case**: The app processes all Big Million Day support tickets in Freshdesk. When API rate limits are hit due to the massive volume, the operation automatically pauses and resumes, ensuring every customer inquiry is captured and processed without manual intervention during the critical sale period.

---

### 2. Bulk Ticket Creation

**Scenario**: Klipkart needs to create thousands of support tickets in Freshdesk for a product recall campaign affecting 50,000 customers.

**Use Case**: The app automatically creates tickets for all affected customers. When Freshdesk API rate limits are reached, the operation pauses and resumes automatically until all tickets are created.

---

### 3. Bulk Contact Import

**Scenario**: Klipkart imports 20,000 customer contacts from their CRM system into Freshdesk to enable support agents to access customer history.

**Use Case**: The app imports all contacts into Freshdesk. If rate limits interrupt the import, the operation automatically continues from where it stopped without losing any data.

---

### 4. Bulk Ticket Updates

**Scenario**: Klipkart needs to update ticket priorities and assign them to agents for 15,000 tickets during a system migration.

**Use Case**: The app updates all tickets in Freshdesk. When rate limits occur, the updates pause and automatically resume until all tickets are processed.

---

### 5. Historical Data Migration

**Scenario**: Klipkart migrates 5 years of support tickets from their previous system into Freshdesk, totaling over 100,000 tickets.

**Use Case**: The app migrates all historical tickets to Freshdesk. Rate limit interruptions are handled automatically, ensuring complete migration without manual intervention.
