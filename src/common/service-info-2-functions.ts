import axios, { AxiosRequestConfig } from 'axios'
import { AccessToken, GetServiceOrder, ListServiceOrder} from './types'

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_ENDPOINT = `https://${API_HOSTNAME}/api/v2/equipment`

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
 * Function to fetch list of service orders for the equipment
 */
export async function fetchServiceOrdersList(accessToken: AccessToken, equipmentId: string): Promise<ListServiceOrder[]> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}/serviceOrders`, 'Failed to fetch list of service orders:')
}

/**
 * Function to fetch details of an service order for the equipment
 */
export async function fetchSingleServiceOrder(accessToken: AccessToken, equipmentId: string, serviceOrderId: string): Promise<GetServiceOrder> {
  return executeRequest(accessToken, `${API_EQUIPMENT_ENDPOINT}/${equipmentId}/serviceOrders/${serviceOrderId}`, 'Failed to fetch details of the service order:')
}
