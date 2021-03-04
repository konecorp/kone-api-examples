export const BUILDING_ID_PREFIX = 'building:'

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
