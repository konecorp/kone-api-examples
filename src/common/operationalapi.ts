import axios, { AxiosRequestConfig } from "axios"
import { AccessToken, EquipmentInfo, EquipmentStatus, ServiceOrder } from "./types"

const API_HOSTNAME = process.env.API_HOSTNAME || 'dev.kone.com'
const API_EQUIPMENT_ENDPOINT = `https://${API_HOSTNAME}/api/v1/equipment`

/**
 * Function to fetch basic information of an equipment
 * @param accessToken valid access token
 * @param equipmentIdWithPrefix equipment identifier with ken prefix
 */
 export async function fetchEquipmentBasicInformation(accessToken: AccessToken, equipmentIdWithPrefix: string): Promise<EquipmentInfo> {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_EQUIPMENT_ENDPOINT}/${equipmentIdWithPrefix}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  // Execute the request
  const result = await axios(requestConfig)
  return result.data
}

/**
 * Function to fetch status of an equipment
 * @param accessToken valid access token
 * @param equipmentIdWithPrefix equipment identifier with ken prefix
 */
export async function fetchEquipmentStatus(accessToken: AccessToken, equipmentIdWithPrefix: string): Promise<EquipmentStatus> {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_EQUIPMENT_ENDPOINT}/${equipmentIdWithPrefix}/status`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  // Execute the request
  const result = await axios(requestConfig)
  return result.data
}

/**
 * Function to fetch list of service orders for the equipment
 * @param accessToken valid access token
 * @param equipmentIdWithPrefix equipment identifier with ken prefix
 */
export async function fetchServiceOrdersList(accessToken: AccessToken, equipmentIdWithPrefix: string): Promise<ServiceOrder[]> {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_EQUIPMENT_ENDPOINT}/${equipmentIdWithPrefix}/serviceOrders`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  // Execute the request
  const result = await axios(requestConfig)
  return result.data
}

/**
 * Function to fetch details of an service order for the equipment
 * @param accessToken valid access token
 * @param equipmentIdWithPrefix equipment identifier with ken prefix
 * @param serviceOrderId service order identifier
 */
export async function fetchSingleServiceOrder(accessToken: AccessToken, equipmentIdWithPrefix: string, serviceOrderId: string): Promise<ServiceOrder> {
  const requestConfig: AxiosRequestConfig = {
    method: 'GET',
    url: `${API_EQUIPMENT_ENDPOINT}/${equipmentIdWithPrefix}/serviceOrders/${serviceOrderId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  // Execute the request
  const result = await axios(requestConfig)
  return result.data
}
