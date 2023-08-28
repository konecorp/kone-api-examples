import axios, { AxiosRequestConfig } from 'axios'
import { AccessToken, Availability, Status, Movement, DoorEvent, Button, EscalatorMovement} from './types'

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_STATUS_2_COMMON_ENDPOINT = `https://${API_HOSTNAME}/api/v2/equipment/search`
const API_EQUIPMENT_STATUS_2_ENDPOINT_DOOR_BUTTON = `https://${API_HOSTNAME}/api/v2/equipment/elevator`
const API_EQUIPMENT_STATUS_2_ENDPOINT_ESC = `https://${API_HOSTNAME}/api/v2/equipment/escalator/movement`


async function executeRequest(
  accessToken: AccessToken,
  endpoint: string,
  equipmentIds: string[],
  errorMessage: string,
  baseUrl: string
) {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: `${baseUrl}/${endpoint}`,
    data: { equipmentIds },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  try {
    const result = await axios(requestConfig)
    return result.data
  } catch (error: any) {
    console.error(errorMessage, error?.message)
  }
}

/**
 * Function to fetch availability information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */

export async function fetchEquipmentAvailability(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<Availability> {
  return executeRequest(
    accessToken,
    'availability',
    equipmentIds,
    'Failed to fetch availability information',
    API_EQUIPMENT_STATUS_2_COMMON_ENDPOINT
  )
}

/**
 * Function to fetch status information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchEquipmentStatus(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<Status> {
  return executeRequest(
    accessToken,
    'status',
    equipmentIds,
    'Failed to fetch status information',
    API_EQUIPMENT_STATUS_2_COMMON_ENDPOINT
  )
}

/**
 * Function to fetch equipment movement information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchEquipmentMovement(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<Movement> {
  return executeRequest(
    accessToken,
    'movement',
    equipmentIds,
    'Failed to fetch movement information',
    API_EQUIPMENT_STATUS_2_COMMON_ENDPOINT
  )
}

/**
 * Function to fetch door event information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchDoorEvent(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<DoorEvent> {
  return executeRequest(
    accessToken,
    'door',
    equipmentIds,
    'Failed to fetch door information',
    API_EQUIPMENT_STATUS_2_ENDPOINT_DOOR_BUTTON
  )
}

/**
 * Function to fetch button event information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchButtonEvent(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<Button> {
  return executeRequest(
    accessToken,
    'button',
    equipmentIds,
    'Failed to fetch button information',
    API_EQUIPMENT_STATUS_2_ENDPOINT_DOOR_BUTTON
  )
}

/**
 * Function to fetch EscalatorEvent information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchEscalatorEvent(
  accessToken: AccessToken,
  equipmentIds: string[]
): Promise<EscalatorMovement> {
  return executeRequest(
    accessToken,
    'direction',
    equipmentIds,
    'Failed to fetch button information',
    API_EQUIPMENT_STATUS_2_ENDPOINT_ESC
  )
}
