import { getNotifications } from "@/app/(app)/dashboard/actions";
import { NotificationDropdown } from "./notification-dropdown";

export async function NotificationBell() {
  const notifs = await getNotifications();
  return <NotificationDropdown notifs={notifs} />;
}
