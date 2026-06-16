/**
 * Ticket Simulator - Platform 3.0
 * Bulk ticket creation with rate-limit auto-resume
 */

let client;

document.onreadystatechange = function () {
  if (document.readyState === 'interactive') {
    renderApp();
  }
};

function renderApp() {
  app.initialized()
    .then(function (initializedClient) {
      client = initializedClient;
      window.client = initializedClient;
      client.events.on('app.activated', onAppActivate);
      onAppActivate();
    })
    .catch(function (error) {
      console.error('Failed to initialize app', error);
      showNotification('danger', 'Failed to initialize app');
    });
}

function onAppActivate() {
  console.log('App activated');
  client.instance.resize({ height: '300px' });
  setButtonState(false, 'Simulate');
}

function validateInput(inputValue) {
  if (!inputValue || inputValue.trim() === '') {
    return { valid: false, message: 'Please enter a number' };
  }

  const ticketCount = parseInt(inputValue, 10);
  if (isNaN(ticketCount)) {
    return { valid: false, message: 'Please enter a valid number' };
  }

  if (ticketCount < 1 || ticketCount > 500) {
    return { valid: false, message: `${ticketCount} is not between 1 and 500` };
  }

  return { valid: true, count: ticketCount };
}

function handleValidationError(message) {
  updateStatus(message);
  showNotification('danger', 'Please enter a valid number between 1 and 500');
}

function parseInvokeResponse(result) {
  if (!result) {
    throw new Error('Empty response from server');
  }

  const raw = result.response !== undefined ? result.response : result;

  if (typeof raw === 'object' && raw !== null) {
    return raw;
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON response from server');
    }
  }

  throw new Error('Invalid response payload');
}

function getInvokeErrorMessage(error) {
  if (!error) {
    return 'Failed to create tickets';
  }

  if (error.message) {
    return error.message;
  }

  if (error.status) {
    return `Request failed with status ${error.status}`;
  }

  return 'Failed to create tickets';
}

function handleAPIError(err) {
  console.error('Error:', err);

  if (err.status === 429) {
    updateStatus('Rate limit reached. Auto-resume scheduled.');
    showNotification('warning', 'Rate limit reached. Auto-resume scheduled.');
    return;
  }

  const message = getInvokeErrorMessage(err);
  updateStatus(message);
  showNotification('danger', message);
}

async function createNTickets() {
  if (!client) {
    updateStatus('App client is not ready yet.');
    return;
  }

  const countInput = document.getElementById('ticketCount');
  const inputValue = countInput && countInput.value;

  const validation = validateInput(inputValue);
  if (!validation.valid) {
    handleValidationError(validation.message);
    return;
  }

  const ticketCount = validation.count;

  setButtonState(true, 'Creating...');
  updateStatus(`Creating ${ticketCount} tickets...`);

  try {
    const result = await client.request.invoke('start_generation', { ticketCount });
    handleGenerationResponse(parseInvokeResponse(result));
  } catch (err) {
    handleAPIError(err);
  } finally {
    setButtonState(false, 'Simulate');
  }
}

function handleScheduledStatus(response) {
  updateStatus(`Rate limited. ${response.remaining || 0} left. Resuming in 7 mins.`);
  showNotification('warning', 'Rate limit reached. Auto-resume scheduled.');
}

function handleCompletedStatus(response) {
  updateStatus(`Success: ${response.totalCreated || 0} tickets created.`);
  showNotification('success', 'Simulation successful.');
}

function handleFailedStatus(response) {
  const errorMessage = response.error || 'Unknown error';
  updateStatus(`Failed: ${errorMessage}`);
  showNotification('danger', `Error: ${errorMessage}`);
}

function handleUnknownStatus(response) {
  updateStatus(`Status: ${response.status || 'unknown'}`);
  showNotification('info', `Status: ${response.status || 'unknown'}`);
}

function handleGenerationResponse(response) {
  console.log('Generation response:', response);

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

function showNotification(type, message) {
  try {
    if (client && client.interface && client.interface.trigger) {
      client.interface.trigger('showNotify', {
        type: type,
        message: message
      });
    } else {
      console.warn(`[Notification ${type}]: ${message}`);
    }
  } catch (err) {
    console.error('Failed to show notification:', err);
  }
}

function setButtonState(disabled, text) {
  const btn = document.getElementById('simulateBtn');
  if (btn) {
    btn.disabled = disabled;
    btn.innerText = text;
  }
}

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

window.handleSimulate = function handleSimulate() {
  createNTickets();
};
