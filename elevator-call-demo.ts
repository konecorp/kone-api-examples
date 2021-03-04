import axios, { AxiosRequestConfig } from 'axios'
import querystring from 'querystring'
import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'

import { Area, BuildingTopology } from './types'

/**
 * Update these two variables with your own credentials.
 */
const CLIENT_ID: string = 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

/**
 * Variables that contain the main endpoints used in this demo project.
 */
const API_HOSTNAME = 'dev.kone.com'
const API_AUTH_TOKEN_ENDPOINT = `https://${API_HOSTNAME}/api/v1/oauth2/token`
const API_RESOURCES_ENDPOINT = `https://${API_HOSTNAME}/api/v1/application/self/resources`
const API_TOPOLOGY_ENDPOINT = `https://${API_HOSTNAME}/api/v1/buildings`
const WEBSOCKET_ENDPOINT = `wss://${API_HOSTNAME}/stream-v1`
const WEBSOCKET_SUBPROTOCOL = 'koneapi'

/**
 * Function is used to log out incoming websocket events
 *
 * @param {string} data data string from Websocket
 */
const onWebsocketMessage = (data: string): void => {
  let dataBlob = JSON.parse(data)

  console.log('Incoming websocket event', dataBlob)
}

/**
 * Fetch the token using the client-credentials flow. In this case, we assume that the user wants to fetch a token
 * that will be used to receive the accessible buildings. Once the user knows the building of interest,
 * a new token has to be generated with the correct callgiving/BUILDING_ID in scope.
 * That is why in the start() flow, this function is invoked twice.
 *
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} buildingId
 */
const fetchAccessToken = async (scope?: string): Promise<string> => {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: API_AUTH_TOKEN_ENDPOINT,
    auth: {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: querystring.stringify({
      grant_type: 'client_credentials',
      scope: scope ?? ''
    }),
  }

  try {
    console.log('Fetch access token')

    const requestResult = await axios(requestConfig)

    // get the accessToken from the response
    const accessToken = requestResult.data.access_token

    console.log('AccessToken successfully fetched')

    return accessToken
  } catch (error) {
    console.error('Error during accessToken fetch', error)
    process.exit()
  }
}

/**
 * returns and array of BUILDING_IDs to which the user has access to
 * In order to successfully make this call, it is needed a token which in scope has
 * application/inventory
 *
 * @param accessToken
 *
 */
const fetchResources = async (accessToken: string): Promise<string[]> => {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: API_RESOURCES_ENDPOINT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  try {
    // Execute the request
    const result = await axios(requestConfig)

    // Assert data to be our wanted list of buildings
    const buildings = result.data as string[]

    // If no buildings are accessible the throw an error
    if (_.isEmpty(buildings)) throw new Error('No buildings found')

    console.log('List of accessible buildings:', buildings)

    return buildings
  } catch (error) {
    console.error('Error during building topology request', error)
    process.exit()
  }
}

/**
 * Function is used to fetch the topology of the given building.
 * It is good practice to fetch the topology once and then cache it for further use.
 *
 * @param {string} accessToken
 * @param {string} buildingId
 */
const fetchBuildingTopology = async (accessToken: string, buildingId: string): Promise<BuildingTopology> => {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_TOPOLOGY_ENDPOINT}/${buildingId}`,
    headers: {
      Authorization: accessToken,
    },
  }

  try {
    // Execute the request
    const result = await axios(requestConfig)

    // Assert data to be our wanted building topology information
    const buildingTopology = result.data as BuildingTopology

    return buildingTopology
  } catch (error) {
    console.error('Error during building topology request', error.response.data)
    process.exit()
  }
}

/**
 * Open up websocket connection with accessToken provided. Promise will resolve once the webSocket is connected.
 *
 * @param {string} accessToken
 */
export const openWebsocketConnection = async (accessToken: string): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    let ws: WebSocket

    try {
      // Try to open the connection. Note that we have to set also subprotocol
      ws = new WebSocket(`${WEBSOCKET_ENDPOINT}?accessToken=${accessToken}`, WEBSOCKET_SUBPROTOCOL)
    } catch (error) {
      console.error('Error while opening websocket connection', error)
    }

    ws.on('error', (error) => {
      console.log('Websocket error', error)
      reject(error)
    })

    ws.on('close', (error) => {
      console.log('Websocket closed', error)
    })

    ws.on('open', async (_event: any) => {
      // Once the connection is open, resolve promise with the websocket instance
      console.log('Websocket open')
      resolve(ws)
    })
  })
}

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
 * Main function that starts the script execution
 */
const start = async () => {
  checkRequiredVariables()

  // Fetch the first token which will by default contain application/inventory scope for our use in the next request
  let accessToken = await fetchAccessToken()

  // Fetch the building ids to which the user has access to, and make sure that we get at least one building
  const buildings = await fetchResources(accessToken)

  // Now fetch a new master token that can access all of the resources. This is different for Elevator Call API or Service Robot API.
  const scope = buildings.filter(id => id.startsWith('building:')).map(id => `callgiving/${id}`).join(' ') + ' application/inventory'

  // Fetch a new access token with a new scope that will enable the access to Elevator Call API or Service Robot API
  accessToken = await fetchAccessToken(scope)

  // Select the first available building
  const targetBuildingId = buildings[0]

  // Fetch the topology of the specific building
  const buildingTopology = await fetchBuildingTopology(accessToken, targetBuildingId)

  // Using the building topology fetched above to randomly set the source area id and destination area id, since this is purely a demonstration
  // If the areas are the same or there is no lift that can move between the areas you will get an error. Restart the process for a new try.
  const randomSourceArea: Area = _.sample(buildingTopology.areas)
  const randomDestinationArea: Area = _.sample(buildingTopology.areas)

  // Open the websocket connection
  const websocketConnection = await openWebsocketConnection(accessToken)

  // Add handler for incoming messages
  websocketConnection.on('message', (data: any) => onWebsocketMessage(data))

  // Build the call payload using the areas previously generated
  const destinationCallPayload = {
    type: 'lift-call',
    callType: 'normal', // normal | robot
    callAction: 'destination',
    requestId: uuidv4(),
    buildingId: targetBuildingId,

    sourceId: randomSourceArea.areaId,
    destinationId: randomDestinationArea.areaId,

    monitorEvents: ['call'], // It is possible to monitor: 'call', 'door', 'deck'
    keepAlive: false, // optional, default to false
  }

  // execute the call within the open websocket connection
  websocketConnection.send(JSON.stringify(destinationCallPayload))
}

start()
