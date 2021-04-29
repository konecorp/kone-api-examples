import * as dotenv from 'dotenv'
dotenv.config()
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { ResumeSessionPayload, CreateSessionPayload } from '../common/types'

import { validateClientIdAndClientSecret, fetchAccessToken, openWebSocketConnection } from '../common/koneapi'

/**
 * Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

/**
 * Function is used to log out incoming WebSocket messages and in this case resolves possible sessionId
 *
 * @param {string} data data string from WebSocket
 */
const onWebSocketMessage = (data: string, sessionIdFn?: (sessionId: string) => void): void => {
  const message = JSON.parse(data)

  console.log('Incoming WebSocket message', message)

  if (message.type === 'ok' && message.data?.sessionId) {
    // if sessionId found, resolve
    sessionIdFn(message.data.sessionId)
  }
}

/**
 * Function opens up a new WebSocket connection, sends create-session payload within the connection and waits
 * for session created 'ok' message and resolves a sessionId string
 */
const openConnectionCreateSessionAndResolveSessionId = async (accessToken: string): Promise<string> => {
  // Open the WebSocket connection
  const firstWebSocketConnection = await openWebSocketConnection(accessToken)
  console.log('First WebSocket connection is open')

  // attach on-message handler
  const sessionIdPromise = new Promise<string>((resolve) => {
    const sessionIdFn = (sessionId: string) => {
      console.log('sessionId found, closing the connection')

      // session is now created, close the first connection
      firstWebSocketConnection.close()

      resolve(sessionId)
    }

    firstWebSocketConnection.on('message', (data: any) => onWebSocketMessage(data, sessionIdFn))

    const createSessionPayload: CreateSessionPayload = {
      type: 'create-session',
      requestId: uuidv4(),
    }

    // send the create-session payload
    firstWebSocketConnection.send(JSON.stringify(createSessionPayload))
  })

  return sessionIdPromise
}

/**
 * Main function that starts the script execution
 */
const start = async () => {
  validateClientIdAndClientSecret(CLIENT_ID, CLIENT_SECRET)

  // Execution flow
  // 1. Open WebSocket connection
  // 2. create-session
  // 3. close connection
  // 4. open a new WebSocket connection
  // 5. resume-session

  // Fetch access token. Note with this token you can't make lit-calls, because token does not include needed scopes.
  // This example is just for creating the websocket connection.
  let accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET)
  console.log('AccessToken successfully fetched')

  // as the function name implies, new connection => create-session => resolve a sessionId
  const sessionId = await openConnectionCreateSessionAndResolveSessionId(accessToken)

  // Open a new WebSocket connection, and resume session with sessionId
  const secondWebSocketConnection = await openWebSocketConnection(accessToken)
  console.log('Second WebSocket connection open')

  // attach message handler
  secondWebSocketConnection.on('message', (data: any) => onWebSocketMessage(data))

  const resumeSessionPayload: ResumeSessionPayload = {
    type: 'resume-session',
    requestId: uuidv4(),
    sessionId,
  }

  // resume session in this second connection
  console.log('Sending resume-session with sessionId')
  secondWebSocketConnection.send(JSON.stringify(resumeSessionPayload))

  // WebSocket Session is now resumed
  // Now you can continue making lift-calls or receive updates from the possible in-flight calls
}

start()
