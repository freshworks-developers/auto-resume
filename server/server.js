/**
 * Ticket Simulator - Optimized for Platform 3.0
 * Serverless functions and event handlers
 */

// Helper: Get scheduled date (7 minutes from now, following 2.3 pattern)
function getScheduledDate(date = new Date()) {
  const now = new Date(date);
  now.setMinutes(now.getMinutes() + 7);
  return now.toISOString();
}

// Helper: Check if schedule already exists (Platform 3.0 compatible)
async function checkIfScheduleExists(scheduleName) {
  try {
    const data = await $schedule.fetch({ name: scheduleName });
    if (data && data.name === scheduleName) {
      console.log(`Schedule "${scheduleName}" already exists. Ignoring new schedule.`);
      return true;
    }
    return false;
  } catch (err) {
    // 404 means schedule doesn't exist - that's fine
    if (err.status === 404) {
      console.log(`Schedule "${scheduleName}" does not exist. Will create a new one.`);
      return false;
    }
    // Other errors - log and assume doesn't exist
    console.log(`Error checking schedule: ${err.status || err.message}`);
    return false;
  }
}

// Helper: Validate schedule data
function validateScheduleData(runId, total, index) {
  return runId && total >= 1 && total <= 500 && index >= 1;
}

// Helper: Create short schedule name (max 30 chars)
function createScheduleName(runId, index) {
  // runId is now numeric format (e.g., 2612601), so just add index
  // Format: r_RUNID_INDEX (e.g., r_2612601_65)
  return `r_${runId}_${index}`;
}

// Helper: Create schedule payload
function createSchedulePayload(runId, total, index) {
  return {
    name: createScheduleName(runId, index),
    data: { 
      runId, 
      ticketCount: total, 
      nextIndex: index 
    },
    schedule_at: getScheduledDate()
  };
}

// Helper: Handle rate limit by scheduling resume (with duplicate check)
async function handleRateLimit(runId, total, index) {
  try {
    // Validate inputs before scheduling
    if (!validateScheduleData(runId, total, index)) {
      console.error(`Invalid schedule data: runId=${runId}, total=${total}, index=${index}`);
      return { 
        status: 'failed', 
        error: 'Invalid data for scheduling resume' 
      };
    }

    const schedulePayload = createSchedulePayload(runId, total, index);
    
    // Check if schedule already exists (prevent duplicates)
    const exists = await checkIfScheduleExists(schedulePayload.name);
    if (exists) {
      return { 
        status: 'scheduled', 
        runId, 
        message: 'Resume already scheduled. Ignoring duplicate.' 
      };
    }

    console.log(`Rate limit at #${index}. Scheduling resume for ${schedulePayload.schedule_at}`);
    console.log(`Schedule payload:`, JSON.stringify(schedulePayload.data, null, 2));

    await $schedule.create(schedulePayload);

    console.log(`Successfully created schedule: ${schedulePayload.name}`);
    return { 
      status: 'scheduled', 
      runId, 
      message: 'Rate limited. Resuming in 7 minutes.' 
    };
  } catch (err) {
    console.error('Schedule creation failed:', err);
    return { status: 'failed', error: 'Could not schedule resume.' };
  }
}

// Helper: Generate unique run ID (format: DDMMYNN)
// DD = day (2 digits), MM = month (2 digits), Y = year last digit (1 digit), NN = sequence (2 digits)
function generateRunId() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');      // 01-31
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const yearDigit = String(now.getFullYear()).slice(-1);     // Last digit of year (6 for 2026)
  
  // Use seconds + milliseconds to create unique sequence number (00-99)
  const sequence = String((now.getSeconds() * 10 + Math.floor(now.getMilliseconds() / 100)) % 100).padStart(2, '0');
  
  return `${day}${month}${yearDigit}${sequence}`;
}

// Helper: Create ticket payload
function createTicketPayload(runId, index) {
  return {
    subject: `Simulated Ticket | ${runId} | #${index}`,
    description: 'This is a simulated ticket for load testing purposes.',
    tags: ['simulated', 'loadtest', runId],
    status: 2,
    priority: 1,
    email: `loadtest_${runId}@example.com` // Required: Freshdesk needs at least one requester field
  };
}

// Helper: Check if error is rate limit
function isRateLimit(status) {
  return status === 429;
}

// Helper: Check if response is success
function isSuccessStatus(status) {
  return status === 200 || status === 201;
}

// Helper: Handle success response (inspired by 2.3 pattern)
function handleSuccessResponse(resp) {
  console.log(JSON.stringify({
    status: resp.status,
    message: 'success'
  }));
  return { success: true };
}

// Helper: Handle error response
function handleErrorResponse(err) {
  return { 
    status: 'failed', 
    error: err.message || 'Unknown error',
    errorStatus: err.status || err.statusCode 
  };
}

// Helper: Handle non-success status response
function handleStatusResponse(resp) {
  if (isRateLimit(resp.status)) {
    return { rateLimited: true };
  }
  return { 
    status: 'failed', 
    error: `API error: ${resp.status}` 
  };
}

// Helper: Handle response (Platform 3.0 compatible, inspired by 2.3 pattern)
function handleResponse(err, resp) {
  // Success case
  if (!err && resp && isSuccessStatus(resp.status)) {
    return handleSuccessResponse(resp);
  }
  
  // Error case
  if (err) {
    return handleErrorResponse(err);
  }
  
  // Non-success status case
  if (resp && resp.status) {
    return handleStatusResponse(resp);
  }
  
  // Invalid response
  return { 
    status: 'failed', 
    error: 'Invalid response' 
  };
}

// Helper: Process API response status (simplified version)
function processResponseStatus(status) {
  if (status === 200 || status === 201) {
    return { success: true };
  }

  if (isRateLimit(status)) {
    return { rateLimited: true };
  }

  return { 
    status: 'failed', 
    error: `API error: ${status}` 
  };
}

// Helper: Parse error response body (safe JSON parsing)
function parseErrorResponse(response) {
  if (!response || typeof response !== 'string') {
    return null;
  }
  
  // Check if it looks like JSON (starts with { or [)
  const trimmed = response.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return null; // Not JSON, might be HTML or plain text
  }
  
  try {
    return JSON.parse(response);
  } catch (e) {
    // If JSON parse fails, return null
    console.log('Failed to parse error response as JSON:', e.message);
    return null;
  }
}

// Helper: Get error message from parsed body
function getErrorMessageFromBody(errorBody) {
  if (errorBody.errors && errorBody.errors.length > 0) {
    return errorBody.errors[0].message || errorBody.description || 'Validation failed';
  }
  return errorBody.description || 'API error';
}

// Helper: Extract message from non-JSON response
function extractNonJSONMessage(response) {
  if (response.length < 200) {
    return response;
  }
  return response.substring(0, 200) + '...';
}

// Helper: Extract message from error properties
function extractFromErrorProperties(error) {
  if (error.message) {
    return error.message;
  }
  
  if (error.error) {
    return String(error.error);
  }
  
  const errorStatus = error.status || error.statusCode;
  if (errorStatus) {
    return `HTTP ${errorStatus}`;
  }
  
  return 'Unknown error';
}

// Helper: Extract error message from response
function extractErrorMessage(error) {
  // Try to parse JSON response first
  if (error.response && typeof error.response === 'string') {
    const errorBody = parseErrorResponse(error.response);
    if (errorBody) {
      return getErrorMessageFromBody(errorBody);
    }
    // If not JSON, use response as-is (truncated if too long)
    return extractNonJSONMessage(error.response);
  }
  
  // Fallback to other error properties
  return extractFromErrorProperties(error);
}

// Helper: Process error object
function processErrorStatus(error) {
  const errorStatus = error.status || error.statusCode;
  if (isRateLimit(errorStatus)) {
    return { rateLimited: true };
  }

  const errorMessage = extractErrorMessage(error);
  
  console.log('Processing error:', {
    status: errorStatus,
    message: errorMessage
  });

  return { 
    status: 'failed', 
    error: errorMessage
  };
}

// Helper: Process single ticket creation
async function processTicket(runId, total, index) {
  try {
    const payload = createTicketPayload(runId, index);
    console.log(`Creating ticket #${index}:`, JSON.stringify(payload, null, 2));
    
    const response = await $request.invokeTemplate('createTicket', {
      body: JSON.stringify(payload)
    });

    console.log(`Ticket #${index} response status:`, response.status);
    console.log(`Ticket #${index} full response:`, JSON.stringify(response, null, 2));
    
    const result = processResponseStatus(response.status);

    if (result.success) {
      return result;
    }

    if (result.rateLimited) {
      console.log(`Rate limited at ticket #${index}`);
      return await handleRateLimit(runId, total, index);
    }

    console.error(`Ticket #${index} failed:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`Exception creating ticket #${index}:`, error);
    console.error(`Error details:`, JSON.stringify({
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      name: error.name
    }, null, 2));
    
    const errorResult = processErrorStatus(error);

    if (errorResult.rateLimited) {
      console.log(`Rate limit exception at ticket #${index}`);
      return await handleRateLimit(runId, total, index);
    }

    return errorResult;
  }
}

// Helper: Handle batch errors (following 2.3 pattern)
async function handleBatchError(error, runId, total, startIndex) {
  console.error('Error in generateBatch:', error);
  console.error(`Failed to create ticket, statusCode: ${error.status || 'unknown'}`);
  
  if (error.status === 401) {
    console.log('Invalid credentials');
    return { 
      status: 'failed', 
      error: 'Invalid API credentials' 
    };
  }
  
  if (error.status === 429) {
    console.log('Exceeded API Rate Limit');
    return await handleRateLimit(runId, total, startIndex);
  }
  
  return { 
    status: 'failed', 
    error: error.message || 'Unknown error occurred' 
  };
}

// Helper: Extract and validate payload data
function extractPayloadData(payload) {
  return payload.data || payload;
}

// Helper: Generate batch of tickets (following 2.3 pattern)
async function generateBatch(runId, total, startIndex) {
  try {
    console.log(`Starting batch: runId=${runId}, total=${total}, startIndex=${startIndex}`);
    
    for (let i = startIndex; i <= total; i++) {
      const result = await processTicket(runId, total, i);
      
      // Continue on success
      if (result.success) {
        console.log(`✓ Ticket #${i} created successfully`);
        continue;
      }

      // Return on rate limit or error
      console.error(`✗ Stopping batch at ticket #${i}. Result:`, JSON.stringify(result, null, 2));
      return result;
    }

    // All tickets created successfully
    console.log(`✓ All ${total} tickets created successfully`);
    return { 
      status: 'completed', 
      runId, 
      totalCreated: total 
    };
  } catch (error) {
    console.error('Exception in generateBatch:', error);
    console.error('Error stack:', error.stack);
    return await handleBatchError(error, runId, total, startIndex);
  }
}

// ============================================
// EXPORTS - Required by FDK Platform 3.0
// ============================================

exports = {
  /**
   * SMI function - Entry point from frontend
   */
  start_generation: async function(request) {
    try {
      console.log('=== start_generation payload ===');
      console.log(JSON.stringify(request, null, 2));
      
      const count = parseInt(request.ticketCount);

      // Validate (1-500)
      if (!count || count < 1 || count > 500) {
        console.log('Validation failed: ticketCount =', count);
        return renderData(null, {
          status: 'failed',
          error: 'Ticket count must be between 1 and 500'
        });
      }

      const runId = generateRunId();
      console.log(`Starting generation: runId=${runId}, count=${count}`);
      const result = await generateBatch(runId, count, 1);
      console.log('Generation result:', JSON.stringify(result, null, 2));
      return renderData(null, result);
    } catch (err) {
      console.error('start_generation error:', err);
      return renderData(null, {
        status: 'failed',
        error: String(err)
      });
    }
  },

  /**
   * Scheduled event handler - Resumes generation after rate limit
   */
  onScheduledEventHandler: async function(payload) {
    try {
      console.log('=== onScheduledEventHandler payload ===');
      console.log(JSON.stringify(payload, null, 2));
      
      const data = extractPayloadData(payload);
      console.log('Extracted data:', JSON.stringify(data, null, 2));
      
      const { runId, ticketCount, nextIndex } = data || {};

      // Validate payload (1-500 for ticketCount, >=1 for nextIndex)
      const isValid = runId && ticketCount >= 1 && ticketCount <= 500 && nextIndex >= 1;
      if (!isValid) {
        console.log('Invalid resume payload:', { runId, ticketCount, nextIndex });
        return;
      }

      console.log(`Resuming generation: runId=${runId}, ticketCount=${ticketCount}, nextIndex=${nextIndex}`);
      const result = await generateBatch(runId, ticketCount, nextIndex);
      console.log(`Resume completed: ${result.status}`);
      console.log('Resume result:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Resume error:', err);
      console.error('Error stack:', err.stack);
    }
  },

  /**
   * App install handler
   */
  onAppInstallHandler: function(payload) {
    console.log('=== onAppInstallHandler payload ===');
    console.log(JSON.stringify(payload, null, 2));
    console.info('App installed');
    renderData();
  },

  /**
   * App uninstall handler
   */
  onAppUninstallHandler: function(payload) {
    console.log('=== onAppUninstallHandler payload ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('App uninstalled');
    renderData();
  },

  /**
   * Ticket create event handler
   */
  onTicketCreateHandler: function(payload) {
    console.log('=== onTicketCreateHandler payload ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('Ticket created event received');
  }
};
