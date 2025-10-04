export function getDeviceId() {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID(); // modern way to generate UUID, fallback if unsupported can be added
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}