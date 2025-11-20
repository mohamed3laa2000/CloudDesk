# API Error Handling Test Documentation

## Overview
This document describes the comprehensive error handling implemented for GCP operations in the frontend.

## Error Types Handled

### 1. GCP Authentication Errors (GCP_AUTH_ERROR)
**User Message:** "GCP authentication failed. The system needs to be re-authenticated with Google Cloud. Please contact your administrator."

**When it occurs:**
- gcloud SDK is not authenticated
- Credentials have expired
- Authentication token is invalid

**Test scenario:**
- Backend returns error code: `GCP_AUTH_ERROR`
- Frontend displays user-friendly message
- Error is logged to console with details

### 2. GCP Permission Errors (GCP_PERMISSION_ERROR)
**User Message:** "Insufficient permissions to perform this operation. Your account may not have the required GCP permissions. Please contact your administrator."

**When it occurs:**
- Service account lacks required IAM permissions
- User attempting operation they're not authorized for

**Test scenario:**
- Backend returns error code: `GCP_PERMISSION_ERROR`
- Frontend displays user-friendly message

### 3. GCP Quota Errors (GCP_QUOTA_ERROR)
**User Message:** "GCP resource quota exceeded. You may have reached your limit for VMs in this region. Try selecting a different region or contact support to increase your quota."

**When it occurs:**
- Project has reached VM quota limit
- Regional resource limits exceeded
- Disk quota exceeded

**Test scenario:**
- Backend returns error code: `GCP_QUOTA_ERROR`
- Frontend suggests actionable solutions (try different region)

### 4. Resource Not Found Errors (GCP_NOT_FOUND)
**User Message:** "The VM instance was not found in Google Cloud. It may have been deleted externally or there may be a synchronization issue."

**When it occurs:**
- VM instance deleted outside of CloudDesk
- Instance ID doesn't exist in GCP
- Zone mismatch

**Test scenario:**
- Backend returns error code: `GCP_NOT_FOUND`
- Frontend explains possible causes

### 5. Timeout Errors (GCP_TIMEOUT)
**User Message:** "The operation timed out. This can happen with slow network connections or when GCP is experiencing high load. Please try again in a few moments."

**When it occurs:**
- gcloud command exceeds timeout limit
- Network latency issues
- GCP API slow response

**Test scenario:**
- Backend returns error code: `GCP_TIMEOUT`
- Frontend suggests retry

### 6. Invalid Configuration Errors (GCP_INVALID_CONFIG)
**User Message:** "Invalid VM configuration. The selected combination of resources may not be available in the chosen region. Please try adjusting your configuration."

**When it occurs:**
- Invalid machine type for region
- Unsupported GPU in selected zone
- Invalid disk configuration

**Test scenario:**
- Backend returns error code: `GCP_INVALID_CONFIG`
- Frontend suggests configuration adjustment

### 7. SDK Not Installed Errors (GCP_SDK_NOT_INSTALLED)
**User Message:** "GCP SDK is not properly configured on the server. Please contact your administrator to resolve this issue."

**When it occurs:**
- gcloud command not found
- SDK not in PATH
- SDK installation corrupted

**Test scenario:**
- Backend returns error code: `GCP_SDK_NOT_INSTALLED`
- Frontend directs user to contact admin

### 8. Generic Command Errors (GCP_COMMAND_ERROR)
**User Message:** Uses server-provided message or "An error occurred while communicating with Google Cloud. Please try again or contact support if the problem persists."

**When it occurs:**
- Unclassified gcloud errors
- Unexpected command failures

**Test scenario:**
- Backend returns error code: `GCP_COMMAND_ERROR`
- Frontend displays server message if available

### 9. Network Errors
**User Message:** "Unable to connect to server. Please check your internet connection and try again."

**When it occurs:**
- No response from backend
- Network connectivity issues
- Server unreachable

**Test scenario:**
- Axios receives no response
- Frontend displays network error message

### 10. HTTP Status Errors
**User Messages:**
- 401: "Your session has expired. Please log in again."
- 403: "Access denied. Your email is not authorized."
- 404: "The requested resource was not found."
- 500/502/503/504: "Server error. Please try again later."

**When it occurs:**
- Various HTTP error status codes

## Implementation Details

### API Service (src/services/api.ts)
- Response interceptor catches all errors
- Checks for GCP error codes in response data
- Maps error codes to user-friendly messages
- Logs detailed error information to console
- Preserves error object for component handling

### Components with Error Handling

#### CreateInstance (src/routes/CreateInstance.tsx)
- Displays ErrorAlert component at top of form
- Scrolls to top when error occurs
- Allows dismissing error message
- Shows detailed GCP error messages

#### Dashboard (src/routes/Dashboard.tsx)
- Shows alert dialogs for operation errors
- Displays GCP error messages in alerts
- Handles start/stop/delete errors

#### InstanceDetail (src/routes/InstanceDetail.tsx)
- Shows toast notifications for errors
- Displays GCP error messages in toasts
- Handles all instance operations

#### WindowsPasswordResetModal (src/components/Windows/WindowsPasswordResetModal.tsx)
- Displays inline error messages
- Shows GCP-specific password reset errors
- Provides context-specific error information

### ErrorAlert Component (src/components/ui/ErrorAlert.tsx)
- Reusable error display component
- Consistent error UI across application
- Dismissible error messages
- Accessible error presentation

## Testing Checklist

### Manual Testing
- [ ] Test instance creation with GCP auth error
- [ ] Test instance creation with permission error
- [ ] Test instance creation with quota error
- [ ] Test instance creation with timeout error
- [ ] Test instance creation with invalid config
- [ ] Test instance start/stop with GCP errors
- [ ] Test instance deletion with GCP errors
- [ ] Test Windows password reset with GCP errors
- [ ] Test network error (disconnect network)
- [ ] Test 401 error (expired token)
- [ ] Verify error messages are user-friendly
- [ ] Verify error details logged to console
- [ ] Verify error dismissal works
- [ ] Verify scroll to error on CreateInstance

### Automated Testing
- Unit tests for error message mapping
- Integration tests for API interceptor
- Component tests for error display

## Error Message Guidelines

All error messages follow these principles:
1. **User-friendly:** Avoid technical jargon
2. **Actionable:** Suggest what user can do
3. **Specific:** Explain what went wrong
4. **Helpful:** Provide context and next steps
5. **Professional:** Maintain calm, supportive tone

## Future Enhancements

1. **Error Recovery:** Automatic retry for transient errors
2. **Error Analytics:** Track error frequency and types
3. **Contextual Help:** Link to documentation for specific errors
4. **Error Reporting:** Allow users to report errors to support
5. **Offline Detection:** Detect and handle offline state
6. **Rate Limiting:** Handle rate limit errors gracefully
