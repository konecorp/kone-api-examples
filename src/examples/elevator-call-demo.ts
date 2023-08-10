import * as dotenv from 'dotenv'
dotenv.config()
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'

import { Area, DestinationCallPayload } from '../common/types'
import {
  fetchAccessToken,
  fetchBuildingTopology,
  fetchResources,
  openWebSocketConnection,
  validateClientIdAndClientSecret,
} from '../common/koneapi'

/**
 *  Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

/**
 * Function is used to log out incoming WebSocket messages
 *
 * @param {string} data data string from WebSocket
 */
const onWebSocketMessage = (data: string): void => {
  let dataBlob = JSON.parse(data)

  console.log('Incoming WebSocket message', dataBlob)
}

/**
 * Main function that starts the script execution
 */
const start = async () => {
  validateClientIdAndClientSecret(CLIENT_ID, CLIENT_SECRET)

  // Fetch the access token with both application/inventory scope and access to execute elevator calls on any building
  // accessible to the application - note that if you have many (100+) resources, you cannot use wildcards
  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, ['application/inventory', 'callgiving/*'])
  console.log('AccessToken successfully fetched')

  // Fetch the building ids to which the user has access to, and make sure that we get at least one building
  const buildings = await fetchResources(accessToken, 'building')
  console.log('List of accessible buildings:', buildings)

  // Select the first available building
  const targetBuildingId = buildings[0]

  // Fetch the topology of the specific building
  const buildingTopology = await fetchBuildingTopology(accessToken, targetBuildingId)

  // Using the building topology fetched above to randomly set the source area id and destination area id, since this is purely a demonstration
  // If the areas are the same or there is no lift that can move between the areas you will get an error. Restart the process for a new try.
  const randomSourceArea: Area = _.sample(buildingTopology.areas)
  const randomDestinationArea: Area = _.sample(buildingTopology.areas)

  // Open the WebSocket connection
  const webSocketConnection = await openWebSocketConnection(accessToken)
  console.log('WebSocket open')

  // Add handler for incoming messages
  webSocketConnection.on('message', (data: any) => onWebSocketMessage(data))

  // Build the call payload using the areas previously generated
  const destinationCallPayload: DestinationCallPayload = {
    type: 'lift-call',
    callType: 'normal', // normal | robot
    callAction: 'destination',
    requestId: uuidv4(),
    buildingId: targetBuildingId,
    sourceId: randomSourceArea.areaId,
    destinationId: randomDestinationArea.areaId,
    monitorEvents: ['call', 'deck'], // It is possible to monitor: 'call', 'door', 'deck'
    keepAlive: false, // optional, default to false
  }

  // execute the call within the open WebSocket connection
  webSocketConnection.send(JSON.stringify(destinationCallPayload))
}

start()
