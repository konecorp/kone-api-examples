import axios, { AxiosRequestConfig } from 'axios'
import { AccessToken, Availability, Entrapment, Movement } from './types'

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_STATUS_2_ENDPOINT = `https://${API_HOSTNAME}/api/v2/equipment/search`

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

export async function fetchEquipmentAvailability(accessToken: AccessToken, equipmentIds: string[]): Promise<Availability> {
  return executeRequest(
    accessToken,
    'availability',
    equipmentIds,
    'Failed to fetch availability information'
  )
}

export async function fetchEquipmentEntrapment(accessToken: AccessToken, equipmentIds: string[]): Promise<Entrapment> {
  return executeRequest(
    accessToken,
    'entrapment',
    equipmentIds,
    'Failed to fetch entrapment information'
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
