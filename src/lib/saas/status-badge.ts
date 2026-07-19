export function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "Active":
    case "Live":
      return "success";
    case "Trial":
    case "Grace Period":
      return "info";
    case "Due":
    case "Overdue":
    case "Suspended":
    case "Blocked":
      return "danger";
    case "Expired":
    case "Archived":
    case "Disabled":
    case "Inactive":
    case "Cancelled":
      return "default";
    default:
      return "default";
  }
}
