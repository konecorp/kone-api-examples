import axios, { AxiosRequestConfig } from 'axios'
import { AccessToken, Availability, Status, Movement, DoorEvent, Button} from './types'

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_STATUS_2_ENDPOINT = `https://${API_HOSTNAME}/api/v2/equipment/search`
const API_EQUIPMENT_STATUS_2_ENDPOINT_V2 = `https://${API_HOSTNAME}/api/v2/equipment/elevator`
const API_EQUIPMENT_STATUS_2_ENDPOINT_ESC = `https://${API_HOSTNAME}/api/v2/equipment/escalator/movement`

async function executeRequest(accessToken: AccessToken, endpoint: string, equipmentIds: string[], errorMessage: string) {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: `${API_EQUIPMENT_STATUS_2_ENDPOINT}/${endpoint}`,
    data: { equipmentIds },
    headers: {
      Authorization: ` Bearer ${accessToken}`,
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

async function executeRequestV2(accessToken: AccessToken, endpoint: string, equipmentIds: string[], errorMessage: string) {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: `${API_EQUIPMENT_STATUS_2_ENDPOINT_V2}/${endpoint}`,
    data: { equipmentIds },
    headers: {
      Authorization: ` Bearer ${accessToken}`,
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

async function executeRequestEsc(accessToken: AccessToken, endpoint: string, equipmentIds: string[], errorMessage: string) {
  const requestConfig: AxiosRequestConfig = {
    method: 'POST',
    url: `${API_EQUIPMENT_STATUS_2_ENDPOINT_ESC}/${endpoint}`,
    data: { equipmentIds },
    headers: {
      Authorization: ` Bearer ${accessToken}`,
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

export async function fetchEquipmentAvailability(accessToken: AccessToken, equipmentIds: string[]): Promise<Availability> {
  return executeRequest(
    accessToken,
    'availability',
    equipmentIds,
    'Failed to fetch availability information'
  )
} 

export async function fetchEquipmentStatus(accessToken: AccessToken, equipmentIds: string[]): Promise<Status> {
  return executeRequest(
    accessToken,
    'status',
    equipmentIds,
    'Failed to fetch status information'
  )
}

export async function fetchEquipmentMovement(accessToken: AccessToken, equipmentIds: string[]): Promise<Movement> {
  return executeRequest(
    accessToken,
    'movement',
    equipmentIds,
    'Failed to fetch movement information'
  )
}

export async function fetchDoorEvent(accessToken: AccessToken, equipmentIds: string[]): Promise<DoorEvent> {
  return executeRequestV2(
    accessToken,
    'door',
    equipmentIds,
    'Failed to fetch door information'
  )
}

export async function fetchButtonEvent(accessToken: AccessToken, equipmentIds: string[]): Promise<Button> {
  return executeRequestV2(
    accessToken,
    'button',
    equipmentIds,
    'Failed to fetch button information'
  )
}

export async function fetchEscalatorEvent(accessToken: AccessToken, equipmentIds: string[]): Promise<Button> {
  return executeRequestEsc(
    accessToken,
    'direction',
    equipmentIds,
    'Failed to fetch button information'
  )
}