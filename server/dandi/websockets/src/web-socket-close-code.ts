export enum WebSocketCloseCode {
  normal = 1000,
  goingAway = 1001,
  protocolError = 1002,
  unsupportedData = 1003,
  invalidFramePayloadData = 1007,
  policyViolation = 1008,
  messageTooBig = 1009,
  missingExtension = 1010,
  internalError = 1011,
  serviceRestart = 1012,
  tryAgainLater = 1013,
  badGateway = 1014,
}
