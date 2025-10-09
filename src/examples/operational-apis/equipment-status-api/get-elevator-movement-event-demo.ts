import * as dotenv from 'dotenv'
dotenv.config()
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import { fetchAccessToken, validateClientIdAndClientSecret } from '../../../common/koneapi'
import { fetchEquipmentMovement } from '../../../common/equipment-status-2-functions'


/**
 * Update these two variables with your own credentials or set them up as environment variables.
 */
const CLIENT_ID: string = process.env.CLIENT_ID || 'YOUR_CLIENT_ID' // eg. 'dcf48ab0-a902-4b52-8c53-1a9aede716e5'
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET' // eg. '31d1329f8344fc12b1a960c8b8e0fc6a22ea7c35774c807a4fcabec4ffc8ae5b'

const KEN = 'YOUR_EQUIPMENT_WITH_KEN_PREFIX' // eg. ken:123456789

/**
 * Demo the Get Elevator Movement
 */
const demoGetElevatorMovement = async (accessToken: string, equipmentId: string) => {
 
  // Fetch movement information of equipment
  console.log(`Fetch movement information of the equipment ${equipmentId}`)
  const movement = await fetchEquipmentMovement(accessToken, [equipmentId])
  console.log(JSON.stringify(movement, undefined, 2))

}


/**
 * Main function to start the script execution
 */
const start = async () => {
  validateClientIdAndClientSecret(CLIENT_ID, CLIENT_SECRET)

  // Fetch access token with needed scope to use the API (e.g rtm/ken:123456789)
  const scopes = [`rtm/${KEN}`]
  const accessToken = await fetchAccessToken(CLIENT_ID, CLIENT_SECRET, scopes)
  console.log(`AccessToken with scope ${scopes} successfully fetched`)

  await demoGetElevatorMovement(accessToken, KEN)
}

start()
