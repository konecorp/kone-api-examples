import { createHmac } from 'crypto'

type SignParams = {
  [key: string]: string
}

const authPrerix = 'KONE-Signature '
const SECRET = 'YOUR_CONFIGURED_SECRET_FOR_WEBHOOK'

/**
 * Demo a function to handle event delivered from KONE to your service via webhook
 * @param headerAuthorization: "Authorization" header in the event delivered to you, which is the signture of the event
 * @param eventBody: The body of the event delivered to you. The code assume that the param is a JSON object
 */
export const webhookEventHandle = async (headerAuthorization: string, eventBody: any) => {

  // Verify that signature exists as "Authorization" header of the received event
  if (!headerAuthorization?.startsWith(authPrerix)) {
    throw new Error('Signature missing in the Authorization header')
  }

  // Verify non-empty event body
  if (!eventBody) {
    throw new Error('Event body missing')
  }

  // Verify that event body contains client id
  if (!eventBody.clientId) {
    throw new Error('Client ID missing in event body')
  }

  // Verify the event's signature
  try {
    verifyEventSignature(headerAuthorization, eventBody)
    // Signature check passed, the event is valid 
    console.log('Received event', eventBody)
  } catch (error: any) {
    // Signature check failed, the event is invalid or too old, it must be ignored
    console.log('Invalid signature', error)
  }
}

function verifyEventSignature(headerAuthorization: string, eventBody: any): void {
  const signParams = parseSignature(headerAuthorization)

  if (!signParams.t || !signParams.v1) {
    throw new Error('Invalid signature')
  }

  const signTime = parseInt(signParams.t, 10)
  const now = Math.floor(new Date().getTime() / 1000)
  if (Math.abs(now - signTime) > 10) {
    throw new Error('Signature has old checksum')
  }
  
  const hmac = createHmac('sha256', SECRET)
  const signedPayload = `${signParams.t}.${JSON.stringify(eventBody)}`
  hmac.update(signedPayload)
  const hash = hmac.digest('hex')
  if (hash !== signParams.v1) {
    throw new Error('Signature mismatched')
  }
}

function parseSignature(headerAuthorization: string): SignParams {
  const signParams: SignParams = {}
  headerAuthorization.substring(authPrerix.length)
    .split(',')
    .forEach((keyvalue) => {
      const keyAndValue = keyvalue.split('=')
      signParams[keyAndValue[0]] = keyAndValue[1]
    })
  return signParams
}
