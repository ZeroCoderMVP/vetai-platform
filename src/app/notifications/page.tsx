import AppLayout from "@/components/layout/AppLayout";
import NotificationList from "@/components/notifications/NotificationList";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  // Pass down the initial alert count for server-side consistency
  let unreadCount = 0;
  if (prisma.notification) {
    unreadCount = await prisma.notification.count({
      where: { userId: "system", isRead: false }
    });
  }

  return (
    <AppLayout title="Уведомления" alertCount={unreadCount}>
      <NotificationList />
    </AppLayout>
  );
}
