import * as dotenv from 'dotenv'
dotenv.config()
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import {
  WebSocketCallState,
  WebSocketResponse,
  WebSocketSession,
  WebSocketBase,
  BuildingId,
  AreaId,
} from '../common/types'
import {
  fetchAccessToken,
  fetchBuildingTopology,
  fetchResources,
  connectWithSession,
  waitForResponse,
} from '../common/koneapi'

/**
 * Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'
const servedLiftCalls: string[] = []

/**
 * Checks if the needed credential have been defined
 */
const checkRequiredVariables = () => {
  if (
    _.isEmpty(CLIENT_ID) ||
    _.isEmpty(CLIENT_SECRET) ||
    CLIENT_ID === 'YOUR_CLIENT_ID' ||
    CLIENT_SECRET === 'YOUR_CLIENT_SECRET'
  )
    throw Error('CLIENT_ID and CLIENT_SECRET needs to be defined')
}

/**
 * Function is used to log out incoming WebSocket events
 *
 * @param {WebSocketBase} data data string from WebSocket
 */
function onWebSocketEvent(data: WebSocketBase): void {
  console.log('Incoming WebSocket event', data)
  if (data.type === 'lift-call-state') {
    const callState = <WebSocketCallState>data
    if (callState.callStatus === 'served' || callState.callStatus === 'cancelled') {
      // Client application must be prepared for duplicate messages sent during reconnections when using sessions
      if (!servedLiftCalls.includes(callState.requestId)) {
        servedLiftCalls.push(callState.requestId)
        console.log(`Lift call ${callState.requestId} finished with state ${callState.callStatus}`)
      }
    }
  }
}

/**
 * Asyncronous function for creating and sending destination lift call and waiting for response
 * @param session WebSocketSession object
 * @param targetBuildingId Target building identifier
 * @param sourceId Source area identifier
 * @param destinationId Destination area identifier
 */
async function constructAndSendDestinationCall(
  session: WebSocketSession,
  targetBuildingId: BuildingId,
  sourceId: AreaId,
  destinationId: AreaId
) {
  const destinationCallPayload = {
    type: 'lift-call',
    callType: 'normal', // normal | robot
    callAction: 'destination',
    requestId: uuidv4(),
    buildingId: targetBuildingId,

    sourceId,
    destinationId,

    monitorEvents: ['call'], // It is possible to monitor: 'call', 'door', 'deck'
    keepAlive: true, // optional, default to false
  }

  // Abort if connection is not open, otherwise we will need to wait until timeout before getting an error
  if (session.connectionStatus !== 'open') {
    console.log(`Unable to send lift call request when connection is down`)
    return
  }
  try {
    // Execute the call within the open WebSocket connection and wait for response
    session.connection.send(JSON.stringify(destinationCallPayload))
    const response: WebSocketResponse = await waitForResponse(session.connection, destinationCallPayload.requestId)
    console.log(`Lift call successfully created with request ID ${response.requestId}`)
  } catch (error) {
    // This error can be either an instance of Error or a WebSocketResponse if error response was received from server
    if (error instanceof Error) console.log('Error creating lift call', error)
    else console.log('Error creating lift call, received error from service', error)
  }
}

/**
 * Main function that starts the script execution
 */
const start = async () => {
  checkRequiredVariables()

  // Define scope for accessing inventory and any buildings allowed to the application
  const scopes = ['callgiving/*', 'application/inventory']

  // Fetch an access token with a scope that will enable the access to Elevator Call API or Service Robot API
  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log('AccessToken successfully fetched')

  // Fetch the building ids to which the user has access to, and make sure that we get at least one building
  const buildings = await fetchResources(accessToken, 'building')
  console.log('List of accessible buildings:', buildings)

  // Select a random available building
  const targetBuildingId = buildings[Math.floor(Math.random() * buildings.length)]

  // Fetch the topology of the specific building
  const buildingTopology = await fetchBuildingTopology(accessToken, targetBuildingId)

  // Open the webSocket connection
  let session: WebSocketSession
  try {
    // To connect with a session, a token and a handler for handshake errors are required
    session = await connectWithSession(accessToken, async (session, statusCode) => {
      console.log(`Error handler with code ${statusCode}, connection status is ${session.connectionStatus}`)
      if (statusCode === 401) {
        // Access token has expired or been invalidated, recreate a new one before trying again
        session.accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
        return true
      } else if (statusCode === 429) {
        // Some client codes like 429 (Too Many Requests) can be retried
        return true
      } else if (statusCode >= 400 || statusCode < 500) {
        // Most client errors are unrecoverable and should not be retried
        console.error(`Unrecoverable client error when reconnecting with status code ${statusCode}`)
        // The example application should automatically exit after this as there are no more pending events in the loop
        clearTimeout(closeConnectionTimer)
        clearInterval(liftCallTimer)
      } else return true
    })
    console.log(`Connection with a session ID ${session.sessionId} successfully established`)

    // WebSocketSession conviniently resends WebSocket messages in parsed JSON format, excluding direct responses to requests
    session.on('session-event', onWebSocketEvent)
    // WebSocketSession emits 'session-resumed' to let the client know that lift calls made after disconnection are automatically stored within the session
    session.on('session-resumed', () => {
      console.log(`WebSocket session resumed ${session.sessionId}`)
    })
    // WebSocketSession emits 'close' whenever the connection is closed
    session.on('close', (error: WebSocketResponse | Error) => {
      console.log(`WebSocket connection closed`, error)
    })
    // WebSocketSession emits 'open' whenever the connection is opened (the first event is missed here as we wait for connectWithSession promise to resolve)
    session.on('open', () => {
      console.log(`WebSocket connection (re)opened`)
    })

    // Create some traffic by creating a new lift call with random areas every minute
    const liftCallTimer = setInterval(() => {
      constructAndSendDestinationCall(
        session,
        targetBuildingId,
        _.sample(buildingTopology.areas).areaId,
        _.sample(buildingTopology.areas).areaId
      )
    }, 60000)
    await constructAndSendDestinationCall(
      session,
      targetBuildingId,
      _.sample(buildingTopology.areas).areaId,
      _.sample(buildingTopology.areas).areaId
    )

    // Randomly disconnect to simulate unstable connection
    function closeConnectionRandomly() {
      const seconds = Math.floor(Math.random() * 10) + 6 // 5-15 seconds
      return setTimeout(() => {
        if (session.connectionStatus === 'open') {
          console.log(`Simulating disconnection`)
          session.connection.close()
        }
        closeConnectionTimer = closeConnectionRandomly()
      }, seconds * 1000)
    }
    let closeConnectionTimer = closeConnectionRandomly()
  } catch (error) {
    // In case intial connection throws an error, it is likely an unrecoverable error with invalid parameters
    console.log('Could not establish initial connection or session', error)
  }
}

start()
