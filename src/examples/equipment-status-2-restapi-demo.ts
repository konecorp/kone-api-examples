import { fetchAccessToken, validateClientIdAndClientSecret } from '../common/koneapi'
import { fetchEquipmentAvailability, fetchEquipmentEntrapment, fetchEquipmentMovement } from '../common/equipment-status-2-supporting-functions'


/**
 * Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

const SANDBOX_KEN = 'ken:111111111'


/**
 * Demo the Equipment Status API 2.0 REST API
 */
const demoEquipmentStatusApi2RestApi = async (accessToken: string, equipmentId: string) => {
  // Fetch availability information of equipment
  console.log(`Fetch availability information of the equipment ${equipmentId}`)
  const availability = await fetchEquipmentAvailability(accessToken, [equipmentId])
  console.log(availability)
  
  // Fetch entrapment information of equipment
  console.log(`Fetch entrapment information of the equipment ${equipmentId}`)
  const entrapment = await fetchEquipmentEntrapment(accessToken, [equipmentId])
  console.log(entrapment)

  // Fetch movement information of equipment
  console.log(`Fetch movement information of the equipment ${equipmentId}`)
  const movement = await fetchEquipmentMovement(accessToken, [equipmentId])
  console.log(movement)
}


/**
 * Main function to start the script execution
 */
const start = async () => {
  validateClientIdAndClientSecret(CLIENT_ID, CLIENT_SECRET)

  // Fetch access token with needed scope to use the API (e.g rtm/ken:123456789)
  const scopes = [`rtm/${SANDBOX_KEN}`]
  const accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)

  await demoEquipmentStatusApi2RestApi(accessToken, SANDBOX_KEN)
}

start()
