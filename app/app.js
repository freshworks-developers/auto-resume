/**
 * Ticket Simulator - Platform 3.0
 * Adapted from Platform 2.3 patterns
 */

let client;

// Initialize app (Platform 3.0 pattern)
document.onreadystatechange = function () {
  if (document.readyState === "interactive") renderApp();

  function renderApp() {
    const onInit = app.initialized();

    onInit.then(getClient).catch(function (error) {
      console.error("Error: Failed to initialize the app");
      console.error(error);
      showNotification("danger", "Failed to initialize app");
    });

    function getClient(_client) {
      window.client = _client;
      client.events.on("app.activated", onAppActivate);
    }
  }
};

// App activation handler
function onAppActivate() {
  console.log("App activated");
  client.instance.resize({ height: "300px" });
  setButtonState(false, "Simulate");
  
  // Optional: Get logged in user (Platform 3.0 compatible)
  // Note: Platform 3.0 may have different API for user data
  try {
    // This is optional - only if needed
    console.log("App ready");
  } catch (error) {
    console.error("Error: Failed to fetch user details");
    console.error(error);
  }
}


// Helper: Validate input value
function validateInput(inputValue) {
  if (!inputValue || inputValue.trim() === '') {
    return { valid: false, message: 'Please enter a number' };
  }
  
  const ticketCount = parseInt(inputValue);
  if (isNaN(ticketCount)) {
    return { valid: false, message: 'Please enter a valid number' };
  }
  
  if (ticketCount < 1 || ticketCount > 500) {
    return { valid: false, message: `${ticketCount} is not between 1 and 500` };
  }
  
  return { valid: true, count: ticketCount };
}

// Helper: Handle validation error
function handleValidationError(message) {
  updateStatus(message);
  showNotification('danger', 'Please enter a valid number between 1 and 500');
}

// Helper: Handle API error
function handleAPIError(err) {
  console.error('Error:', err);
  if (err.status === 429) {
    updateStatus('Rate limit reached. Auto-resume scheduled.');
    showNotification('warning', 'Rate limit reached. Auto-resume scheduled.');
  } else {
    updateStatus('Failed to create tickets');
    showNotification('danger', 'Failed to create tickets');
  }
}

/**
 * Main function: Create N tickets
 */
async function createNTickets() {
  const countInput = document.getElementById('ticketCount');
  const inputValue = countInput?.value;
  
  // Validate input
  const validation = validateInput(inputValue);
  if (!validation.valid) {
    handleValidationError(validation.message);
    return;
  }

  const ticketCount = validation.count;
  setButtonState(true, 'Creating...');
  updateStatus(`Creating ${ticketCount} tickets...`);

  try {
    const data = await client.request.invoke("start_generation", { ticketCount });
    
    if (data.response) {
      handleGenerationResponse(data.response);
    }
  } catch (err) {
    handleAPIError(err);
  } finally {
    setButtonState(false, "Simulate");
  }
}

// Helper: Handle scheduled status
function handleScheduledStatus(response) {
  updateStatus(`Rate limited. ${response.remaining || 0} left. Resuming in 7 mins.`);
  showNotification("warning", "Rate limit reached. Auto-resume scheduled.");
}

// Helper: Handle completed status
function handleCompletedStatus(response) {
  updateStatus(`Success: ${response.totalCreated || 0} tickets created.`);
  showNotification("success", "Simulation successful.");
}

// Helper: Handle failed status
function handleFailedStatus(response) {
  updateStatus(`Failed: ${response.error || 'Unknown error'}`);
  showNotification("danger", `Error: ${response.error || 'Unknown error'}`);
}

// Helper: Handle unknown status
function handleUnknownStatus(response) {
  updateStatus(`Status: ${response.status}`);
  showNotification("info", `Status: ${response.status}`);
}

/**
 * Handle generation response (Platform 3.0)
 */
function handleGenerationResponse(response) {
  console.log("Generation response:", response);
  
  switch (response.status) {
    case 'scheduled':
      handleScheduledStatus(response);
      break;
    case 'completed':
      handleCompletedStatus(response);
      break;
    case 'failed':
      handleFailedStatus(response);
      break;
    default:
      handleUnknownStatus(response);
  }
}

/**
 * Show notification (Platform 3.0 compatible, following 2.3 pattern)
 */
function showNotification(type, message) {
  try {
    if (client && client.interface && client.interface.trigger) {
      client.interface.trigger("showNotify", {
        type: type,
        message: message,
      });
    } else {
      // Fallback: log to console if client not ready
      console.warn(`[Notification ${type}]: ${message}`);
    }
  } catch (err) {
    console.error('Failed to show notification:', err);
  }
}

/**
 * Update button state
 */
function setButtonState(disabled, text) {
  const btn = document.getElementById('simulateBtn');
  if (btn) {
    btn.disabled = disabled;
    btn.innerText = text;
  }
}

/**
 * Update status message
 */
function updateStatus(message) {
  const statusMsg = document.getElementById('statusMessage');
  const statusContainer = document.getElementById('statusContainer');
  
  if (statusMsg) {
    statusMsg.innerText = message;
  }
  
  if (statusContainer && message) {
    statusContainer.style.display = 'block';
  }
}

// Expose handleSimulate for onclick (following 2.3 pattern)
function handleSimulate() {
  createNTickets();
}
