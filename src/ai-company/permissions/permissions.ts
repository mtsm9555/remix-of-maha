export class Permissions {
  canRead(role: string) {
    return role === "admin" || role === "manager";
  }
}