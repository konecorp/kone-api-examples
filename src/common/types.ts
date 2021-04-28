import WebSocket from 'ws'
import { EventEmitter } from 'events'

export const BUILDING_ID_PREFIX = 'building:'

/**
 * A string that represents a JWT access token
 */
export type AccessToken = string
/**
 * ISO timestamp string in format '2021-03-22T13:52:57.412Z'
 */
export type Timestamp = string
/**
 * Globally unique identifier for the building in the format `building:123456`
 */
export type BuildingId = string
/**
 * Globally unique identifier for the lift group in the format `group:123456:1`
 */
export type GroupId = string
/**
 * Globally unique identifier for the lift in the format `lift:123456:1:1`
 */
export type LiftId = string
/**
 * Globally unique identifier for the lift floor in the format `floor:123456:1:1:1`
 */
export type LiftFloorId = string
/**
 * Globally unique identifier for the side in the format `side:123456:1`
 */
export type SideId = string
/**
 * Globally unique identifier for the deck in the format `deck:123456:1:1:1`
 */
export type DeckId = string
/**
 * Globally unique identifier for the area in the format `area:123456:1000`
 */
export type AreaId = string
/**
 * Globally unique identifier for the door in the format `door:123456:1:1:1:1`
 */
export type DoorId = string
/**
 * Call type of a lift call
 */
export type CallType = 'normal' | 'robot'
/**
 * Call action of a lift call
 */
export type CallAction = 'destination'
/**
 * Status of the call. In a success case the status will progress from 'created' to 'approved' to 'served'. Once 'served' or 'cancelled' state is reached, there will be no further state updates.
 */
export type CallStatus = 'created' | 'approved' | 'served' | 'cancelled'
/**
 * Passenger guidance
 */
export type PassengerGuidance = 'wait_for_car' | 'enter_car' | 'stay_in_car' | 'exit_car' | 'call_cancelled'
/**
 * Cancel reason
 */
export type CallCancelReason =
  | 'area_does_not_exist'
  | 'area_is_locked'
  | 'please_wait'
  | 'cannot_serve_now'
  | 'terminal_is_not_in_use'
  | 'invalid_side'
  | 'no_lifts_available'
  | 'access_denied'
  | 'unknown'

/**
 * A physical building.
 */
export type BuildingTopology = {
  /**
   * Identifier of the building.
   */
  buildingId: BuildingId
  /**
   * Lift groups in the building.
   */
  groups: Group[]
  /**
   * Areas in the building.
   */
  areas: Area[]
}

/**
 * Logical lift group. Lift groups are the groups of lifts working in unison.
 * For example the lift call is sent to certain lift group which then decides
 * the lift that will serve the call.
 */
export type Group = {
  /**
   * Identifier of the group.
   */
  groupId: GroupId
  /**
   * Lifts in the group.
   */
  lifts: Lift[]
}

/**
 * Lift is a physical lift in the building that belongs to certain lift group.
 * Lifts can have multiple decks in them that serve lift users in different floors
 * at the same time.
 */
export type Lift = {
  /**
   * Identifier of the lift.
   */
  liftId: LiftId
  /**
   * User visible name of the lift.
   */
  liftName: string
  /**
   * Decks of the lift.
   */
  decks: LiftDeck[]
  /**
   * Floors served by the lift.
   */
  floors: LiftFloor[]
}

/**
 * Lift deck is one physical space inside the lift car.
 */
export type LiftDeck = {
  /**
   * Identifier of the deck.
   */
  deckId: DeckId
  /**
   * Identifier of the area inside the deck.
   */
  deckAreaId: AreaId
  /**
   * Areas served by the deck. This is a static structure describing all the areas served by the deck.
   * At runtime depending on its actual vertical position the deck can serve zero, one or multiple areas.
   */
  areasServed: AreaId[]
  /**
   * Doors of the deck.
   */
  doors: Door[]
}

/**
 * Floor served by the lift.
 */
export type LiftFloor = {
  /**
   * Identifier of the floor.
   */
  liftFloorId: LiftFloorId

  /**
   * Height of the floor in millimeters.
   */
  heightMillimeters: number

  /**
   * Level of the floor bottom in millimeters. Lowest floor has level of zero.
   */
  levelMillimeters: number

  /**
   * Areas served from the floor
   */
  areasServed: AreaId[]
}

/**
 * Areas are the logical spaces in the building that the user can access.
 * The areas are e.g. the source and destination of an lift call.
 */
export type Area = {
  /**
   * Identifier for the area.
   */
  areaId: AreaId
  /**
   * In which group side does this area reside. The side can be used to link to together areas and deck doors.
   * Undefined if the area is not linked to any door.
   */
  sideId?: SideId
  /**
   * Short name for this area. This is the name usually visible in the lift control buttons.
   */
  shortName: string
  /**
   * Can this area be used to exit the building.
   */
  exitFloor: boolean
  /**
   * Height in millimeters.
   */
  heightMillimeters: number
  /**
   * Level in millimeters (starting from 0)
   */
  levelMillimeters: number
}

export type Door = {
  /**
   * Identifier for the door.
   */
  doorId: DoorId
  /**
   * Side of the door.
   */
  sideId: SideId
}

export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 429 | 500

/**
 * Base interface for each message sent and received via WebSocket
 */
export interface WebSocketBase {
  /**
   * Each message must carry a type attribute that declares the contained request/event/response
   */
  type: string
}

/**
 * Each request sent by the client will be responded with a respose of either 'ok' or 'error' type
 */
export interface WebSocketResponse extends WebSocketBase {
  type: 'ok' | 'error'
  /**
   * Connection identifier that might be needed in case KONE customer service is contacted
   */
  connectionId: string
  /**
   * Request ID either provided by the client or generated by the service
   */
  requestId: string
  /**
   * HTTP analogous status code
   */
  statusCode: StatusCode
  /**
   * Human readable message used with error response
   */
  message?: string
  /**
   * Optional data sent by the service in response to the request
   */
  data?: object
}

/**
 * Call state event
 */
export interface WebSocketCallState extends WebSocketBase {
  type: 'lift-call-state'
  timestamp: Timestamp
  requestId: string
  callStatus: CallStatus
  passengerGuidance?: PassengerGuidance
  callType: CallType
  callAction: CallAction
  buildingId: BuildingId
  groupId: GroupId
  liftId?: LiftId
  deckId?: DeckId
  sourceDoorId?: DoorId
  destinationDoorId?: DoorId
  cancelReason?: CallCancelReason
  sourceId: AreaId
  destinationId?: AreaId
}

/**
 * Session response with SessionData
 */
export interface WebSocketCreateSessionResponse extends WebSocketResponse {
  type: 'ok'
  data: SessionData
}

/**
 * Response data to create-session request
 */
export interface SessionData {
  sessionId: string
}

/**
 * WebSocketSession interface with emitted events
 */
export declare interface WebSocketSession {
  // A previous session has been fully resumed
  on(event: 'session-resumed', listener: (this: WebSocketSession) => void): this
  // Event from service (any message excluding responses)
  on(event: 'session-event', listener: (this: WebSocketSession, data: WebSocketBase) => void): this
  // Resent event from WebSocket client
  on(event: 'open', listener: (this: WebSocketSession) => void): this
  // Resent event from WebSocket client
  on(event: 'close', listener: (this: WebSocketSession, error: WebSocketResponse | Error) => void): this
}

/**
 * Class definition for WebSocketSession
 */
export class WebSocketSession extends EventEmitter {
  /**
   * Connection status
   */
  connectionStatus: 'open' | 'closed'
  /**
   * Access token that can be updated, the new token will be used at next reconnect
   */
  accessToken: AccessToken
  /**
   * WebSocket client connection
   */
  connection?: WebSocket
  /**
   * Session identifier
   */
  sessionId?: string
}

/**
 * Basic information of equipment
 */
export interface EquipmentInfo {
  equipmentId: string
  type: string
  description?: string
  serialNumber?: string
  addressCity?: string
  addressName?: string
  addressStreet?: string
  addressPostCode?: string
  addressState?: string
  addressCountry?: string
}

/**
 * Maintenance status of equipment
 */
export interface EquipmentStatus {
  entrapment?: boolean
  status?: string
  maintenance?: {
    status?: string
    technicianComment?: string
  }
}

/**
 * Service order of equipment
 */
export interface ServiceOrder {
  serviceOrderId: string
  activityType?: string
  status?: string
  description?: string
  createdDateTime?: string
  actualArrivalDateTime?: string
  finishedDateTime?: string
  invoices?: {
    costAmount?: number
    costCurrency?: string
  }
}
