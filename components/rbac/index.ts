// Componentes de RBAC
export { Can, CanAll, CanAny, Cannot } from "./Can";
export { VerifyPermissions, useVerifyPermissions } from "./VerifyPermissions";

// Re-export do hook para conveniência
export { usePermissions } from "@/contexts/PermissionContext";
