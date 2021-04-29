import axios, { AxiosRequestConfig } from 'axios'
import querystring from 'querystring'
import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'

import {
  BuildingTopology,
  WebSocketSession,
  WebSocketResponse,
  WebSocketCreateSessionResponse,
  StatusCode,
  AccessToken,
  CreateSessionPayload,
  ResumeSessionPayload,
  WebSocketResumeSessionResponse,
} from './types'

/**
 * Variables that contain the main endpoints used in this demo project.
 */
const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_AUTH_TOKEN_ENDPOINT = process.env.API_AUTH_TOKEN_ENDPOINT || `https://${API_HOSTNAME}/api/v1/oauth2/token`
const API_AUTH_LIMITED_TOKEN_ENDPOINT =
  process.env.API_AUTH_LIMITED_TOKEN_ENDPOINT || `https://${API_HOSTNAME}/api/v1/oauth2/limited-token`
const API_RESOURCES_ENDPOINT =
  process.env.API_RESOURCES_ENDPOINT || `https://${API_HOSTNAME}/api/v1/application/self/resources`
const API_TOPOLOGY_ENDPOINT = process.env.API_TOPOLOGY_ENDPOINT || `https://${API_HOSTNAME}/api/v1/buildings`
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT || `wss://${API_HOSTNAME}/stream-v1`
const WEBSOCKET_SUBPROTOCOL = process.env.WEBSOCKET_SUBPROTOCOL || 'koneapi'

/**
 * Fetch the token using the client-credentials flow. In this case, we assume that the user wants to fetch a token
 * that will be used to receive the accessible buildings. Once the user knows the building of interest,
 * a new token has to be generated with the correct callgiving/BUILDING_ID in scope.
 * That is why in the start() flow, this function is invoked twice.
 *
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string[]} scopes
 */
export async function fetchAccessToken(
  clientId: string,
  clientSecret: string,
  scopes?: string[]
): Promise<AccessToken> {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: API_AUTH_TOKEN_ENDPOINT,
    auth: {
      username: clientId,
      password: clientSecret,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: querystring.stringify({
      grant_type: 'client_credentials',
      scope: scopes ? scopes.join(' ') : '',
    }),
  }

  const requestResult = await axios(requestConfig)

  // get the accessToken from the response
  const accessToken = requestResult.data.access_token

  return accessToken
}

/**
 * Fetch a secure limited token that can be passed to client devices
 * @param {string} accessToken Master token used to generate a limited token
 * @param {string[]} scopes Array of scopes that should be a subset of the scopes requested for the master token
 * @param {string} userIdentity Device or end-user specific unique identifier
 * @param {number} maxAgeSeconds Maximum age for the token to be consumed by the service
 * @param {boolean} singleUse Determines if the token can only be used for one request or for opening a WebSocket connection
 */
export async function fetchLimitedAccessToken(
  accessToken: AccessToken,
  scopes: string[],
  userIdentity: string,
  maxAgeSeconds = 60,
  singleUse = true
): Promise<AccessToken> {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: API_AUTH_LIMITED_TOKEN_ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      endUserIdentity: userIdentity,
      scopes,
      maxAgeSeconds,
      singleUse,
    },
  }

  const requestResult = await axios(requestConfig)

  // get the accessToken from the response
  const limitedToken = requestResult.data.access_token

  return limitedToken
}

/**
 * returns and array of resource identifiers to which the user has access to
 * In order to successfully make this call, it is needed a token which in scope has
 * application/inventory
 *
 * @param accessToken
 * @param resourceType
 *
 */
export const fetchResources = async (accessToken: AccessToken, resourceType: string): Promise<string[]> => {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: API_RESOURCES_ENDPOINT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  // Execute the request
  const result = await axios(requestConfig)

  // Assert data to be our wanted list of buildings
  const resources = (result.data as string[]).filter((resource) => resource.startsWith(`${resourceType}:`))

  // If no buildings are accessible the throw an error
  if (_.isEmpty(resources)) throw new Error('No resources found')

  return resources
}

/**
 * Function is used to fetch the topology of the given building.
 * It is good practice to fetch the topology once and then cache it for further use.
 *
 * @param {string} accessToken
 * @param {string} buildingId
 */
export async function fetchBuildingTopology(accessToken: AccessToken, buildingId: string): Promise<BuildingTopology> {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_TOPOLOGY_ENDPOINT}/${buildingId}`,
    headers: {
      Authorization: accessToken,
    },
  }

  // Execute the request
  const result = await axios(requestConfig)

  // Assert data to be our wanted building topology information
  const buildingTopology = result.data as BuildingTopology

  return buildingTopology
}

/**
 * A promise for opening WebSocket connection
 *
 * @promise WebSocketPromise
 * @fulfill {WebSocket} WebSocket client instance
 * @reject {number} HTTP Status code for
 * @reject {Error} Local error
 */

/**
 * Open up WebSocket connection with accessToken provided. Promise will resolve once the webSocket is connected.
 *
 * @param {string} accessToken The initial access token used to connect to the WebSocket service
 * @returns {WebSocketPromise}
 */
export async function openWebSocketConnection(accessToken: AccessToken): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket

    try {
      // Try to open the connection. Note that we have to set also subprotocol
      ws = new WebSocket(`${WEBSOCKET_ENDPOINT}?accessToken=${accessToken}`, WEBSOCKET_SUBPROTOCOL)
    } catch (error) {
      console.error('Error while opening WebSocket connection', error)
      reject(error)
    }

    // error and close events are absorbed until connection has been established
    ws.on('error', (error) => {
      console.error('WebSocket error', error)
    })

    ws.on('close', (statusCode, message) => {
      console.error(`WebSocket closed ${statusCode} ${message}`)
      reject(statusCode)
    })

    ws.on('open', async (_event: any) => {
      // Once the connection is open, resolve promise with the WebSocket instance
      ws.removeAllListeners('close')
      resolve(ws)
    })
  })
}

/**
 * Creates a new session and resolves with the generated session ID. Rejects with Error or WebSocketResponse.
 * @param connection Open WebSocket connection
 */
export async function createSession(connection: WebSocket): Promise<string> {
  // Build payload for creating session
  const createSessionPayload: CreateSessionPayload = {
    type: 'create-session',
    requestId: uuidv4(),
  }

  // Create session
  connection.send(JSON.stringify(createSessionPayload))
  const sessionResponse = <WebSocketCreateSessionResponse>(
    await waitForResponse(connection, createSessionPayload.requestId)
  )
  return sessionResponse.data.sessionId
}

/**
 * Resumes a session. Rejects with Error or WebSocketResponse.
 * @param connection Open WebSocket connection
 * @param sessionId Session ID to resume
 */
export async function resumeSession(connection: WebSocket, sessionId: string): Promise<WebSocketResumeSessionResponse> {
  // Build payload for resuming session
  const resumeSessionPayload: ResumeSessionPayload = {
    type: 'resume-session',
    requestId: uuidv4(),
    sessionId: sessionId,
    resendLatestStateUpToSeconds: 30,
  }
  connection.send(JSON.stringify(resumeSessionPayload))
  return await waitForResponse(connection, resumeSessionPayload.requestId)
}

/**
 * A promise for connecting to WebSocket with a session
 *
 * @promise WebSocketSessionPromise
 * @fulfill {WebSocketSession} Returns WebSocketSession object that capsulates the connection, session ID, connection status and possible error code
 * @reject {Error} Local error
 * @reject {WebSocketResponse} Response from service
 */

/**
 * Establish WebSocket connection and create a session. Automatically reconnects and resumes the session. Resolves after session has been created and rejects if initial connection or session creation fails.
 * @param accessToken Access token
 * @param errorHandler Callback function for resolving reconnection handshake failures
 * @returns {WebSocketSessionPromise}
 */
export async function connectWithSession(
  accessToken: AccessToken,
  errorHandler: (session: WebSocketSession, statusCode: StatusCode) => Promise<boolean>
): Promise<WebSocketSession> {
  // Helper for sleeping before a retry
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  // Use an incremental delay (in ms) between connection retries
  let incrementalRetryDelay: number

  // Initialize new session with closed status
  let session: WebSocketSession = new WebSocketSession()
  session.connectionStatus = 'closed'
  session.accessToken = accessToken

  // Store promise settling functions until initial session is established
  let resolvePromise: undefined | ((value: WebSocketSession) => void)
  let rejectPromise: undefined | ((reason?: Error | WebSocketResponse) => void)

  // Event handler for connection 'open' event
  async function onOpen() {
    session.connectionStatus = 'open'
    session.emit('open')
    try {
      // Create a new session
      if (!session.sessionId) {
        session.sessionId = await createSession(session.connection)
        // Resolve initial session promise
        resolvePromise(session)
      }
      // Resume earlier session
      else {
        await resumeSession(session.connection, session.sessionId)
        // Emit session-resumed after reconnecting to inform application that any requests made will be secure within the session
        session.emit('session-resumed')
      }
      // Restore default retry delay on success
      incrementalRetryDelay = 0
    } catch (error) {
      // Something went wrong, this could be a WebSocketResponse with status code or an error caused by client
      close(error)
      // The error might have been caused by a dead connection so let's reconnect
      if (session.sessionId) connect()
    }
  }

  // Event handler for connection 'close' event (this is not reached in case of handshake erro since the listener is removed before being triggered)
  function onClose(statusCode: number, message: string) {
    // Run close to remove listeners and emit 'close' event
    close(new Error(`Connection closed with code ${statusCode} ${message}`))
    // Reconnect
    connect()
  }

  // By Node.js standards, 'error' events MUST be consumed. However, WebSocket client automatically also emits 'close' event when connection is lost, so we don't want to handle same situation twice.
  function onError() {}

  // Event handler for 'unexpected-response' event. This is triggered is HTTP UPGRADE request fails, and having this listened prevents default cleanup
  async function onHandshakeError(req: any, res: any) {
    // At this point the connection is not yet 'open', but to handle the handshake error correctly, close() needs to be called
    session.connection.close()
    // Must call removeListeners() after calling close() as that will invoke 'error' event that must be consumed
    removeListeners()
    // Invoke error handler to resolve the status code returned or fail
    const retry = await errorHandler(session, res.statusCode)
    if (retry) {
      // Retry if error handler returned trueish value
      connect()
    }
  }

  // Event handler for 'message' event to parse the message and emit 'session-event' in case of non-response events
  function onMessage(message: string) {
    try {
      // Parse message to JSON
      const messageJson = JSON.parse(message)
      // Consume any response messages
      if (messageJson.type !== 'ok' && messageJson.type !== 'error') {
        // Re-emit events through the session instance in parsed JSON format
        session.emit('session-event', messageJson)
      }
    } catch (error) {} // Ignore non-JSON messages
  }

  // Utility function for cleaning up connection listeners when closing the connection
  function removeListeners() {
    session.connection.off('message', onMessage)
    session.connection.off('open', onOpen)
    session.connection.off('close', onClose)
    session.connection.off('error', onError)
    session.connection.off('unexpected-response', onHandshakeError)
  }

  // Connects to WebSocket (must not be connected when calling this)
  async function connect(initial = false) {
    if (session.connectionStatus === 'open') return
    if (!initial) {
      // Wait an incremental delay to prevent tight reconnect loops
      if (incrementalRetryDelay) incrementalRetryDelay *= 2
      else incrementalRetryDelay = 100
      await sleep(incrementalRetryDelay)
    }
    try {
      // Open a connection and setup event handlers
      session.connection = new WebSocket(
        `${WEBSOCKET_ENDPOINT}?accessToken=${session.accessToken}`,
        WEBSOCKET_SUBPROTOCOL
      )
      session.connection.on('message', onMessage)
      session.connection.on('open', onOpen)
      session.connection.on('close', onClose)
      session.connection.on('error', onError)
      session.connection.on('unexpected-response', onHandshakeError)
    } catch (error) {
      // Reject initial connection promise
      if (!session.sessionId) {
        rejectPromise(error)
      }
      // In other cases, reconnect (even though WebSocket constructor usually only throws at bad parameters, getting here means the parameters have worked once)
      else connect()
    }
  }

  // Closes and cleans up connection
  async function close(error: Error | WebSocketResponse) {
    if (session.connectionStatus === 'open') {
      removeListeners()
      session.connectionStatus = 'closed'
      session.connection.close()
      session.emit('close', error)
      // In case of establishing the initial connecion, it is likely that there is a validation or similar error that would prevent retry from doing any good
      if (!session.sessionId) {
        rejectPromise(error)
      }
    }
  }

  return new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
    connect(true)
  })
}

/**
 * Checks if the CLIENT_ID and CLIENT_SECRET has been defined
 */
export const validateClientIdAndClientSecret = (CLIENT_ID: string, CLIENT_SECRET: string) => {
  if (
    _.isEmpty(CLIENT_ID) ||
    _.isEmpty(CLIENT_SECRET) ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET'
  )
    throw Error('CLIENT_ID and CLIENT_SECRET needs to be defined')
}

/**
 * Helper function for serializing subsequent WebSocket messages without blocking concurrent events
 * @param webSocketConnection
 * @param requestId
 * @param timeoutSeconds
 */
export async function waitForResponse(
  webSocketConnection: WebSocket,
  requestId: string,
  timeoutSeconds = 10
): Promise<WebSocketResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      webSocketConnection.removeListener('message', onMessage)
      reject(new Error('Timeout'))
    }, timeoutSeconds * 1000)

    const onMessage = function (data: string) {
      try {
        const dataBlob = JSON.parse(data)
        if (dataBlob.type === 'ok' && dataBlob.requestId === requestId) {
          clearTimeout(timer)
          webSocketConnection.off('message', onMessage)
          resolve(dataBlob)
        } else if (dataBlob.type === 'error' && dataBlob.requestId === requestId) {
          clearTimeout(timer)
          webSocketConnection.off('message', onMessage)
          reject(dataBlob)
        }
      } catch (error) {}
    }
    // Push onMessage handler to the top of listener list to receive event as early as possible
    webSocketConnection.prependListener('message', onMessage)
  })
}
