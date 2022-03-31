import axios, { AxiosRequestConfig } from 'axios'
import { AccessToken, EquipmentInfo, EquipmentStatus, ServiceOrder } from './types'

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_ENDPOINT = `https://${API_HOSTNAME}/api/v1/equipment`

async function executeRequest(accessToken: AccessToken, url: string, errorMessage: string) {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
  // Execute the request
  try {
    const result = await axios(requestConfig)
    return result.data
  } catch (error) {
    console.error(errorMessage, error?.message)
  }
}

/**
 * Function to fetch basic information of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
 export async function fetchEquipmentBasicInformation(accessToken: AccessToken, equipmentId: string): Promise<EquipmentInfo> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}`, 'Failed to fetch information of the equipment:')
}

/**
 * Function to fetch status of an equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchEquipmentStatus(accessToken: AccessToken, equipmentId: string): Promise<EquipmentStatus> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}/status`, 'Failed to fetch maintenance status:')
}

/**
 * Function to fetch list of service orders for the equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 */
export async function fetchServiceOrdersList(accessToken: AccessToken, equipmentId: string): Promise<ServiceOrder[]> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}/serviceOrders`, 'Failed to fetch list of service orders:')
}

/**
 * Function to fetch details of an service order for the equipment
 * @param accessToken valid access token
 * @param equipmentId equipment identifier with ken prefix. e.g ken:123456789
 * @param serviceOrderId service order identifier
 */
export async function fetchSingleServiceOrder(accessToken: AccessToken, equipmentId: string, serviceOrderId: string): Promise<ServiceOrder> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}/serviceOrders/${serviceOrderId}`, 'Failed to fetch details of the service order:')
}
