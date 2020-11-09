import _ from "lodash";

export function isRole(user: any, role: string) {
  if (!user.roles.length) {
    return false;
  }
  return user.roles.findIndex((r: any) => r.token === role) >= 0;
}

export function hasPermission(user: any, permission: string) {
  user.permissions =
    user.permissions ||
    _.flatMap((user.roles || []).map((role: any) => role.permissions));
  if (!user.permissions.length) {
    return false;
  }
  return user.permissions.findIndex((r: any) => r.token === permission) >= 0;
}
