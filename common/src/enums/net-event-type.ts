/**
 * Enum representing 'events' for network messages
 */
export enum NetEventType {
  ChatMessage = 'ChatMessage',
  JoinRoom = 'JoinRoom',
  CreateRoom = 'CreateRoom',
  InitState = 'InitState',
  ESEvent = 'ESEvent',
  EventAggRequest = 'EventAggRequest',
  WorldState = 'WorldState',
}
