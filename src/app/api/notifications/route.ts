import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // unread, actionable, reports, system

    const whereClause: any = { userId: "system" };
    
    // Simplistic text-based filtering for MVP rules
    if (filter === 'unread') {
      whereClause.isRead = false;
    } else if (filter === 'actionable') {
      whereClause.isActionable = true;
      whereClause.status = { notIn: ['done', 'dismissed'] };
    } else if (filter === 'reports') {
      whereClause.type = 'report_alert';
    } else if (filter === 'system') {
      whereClause.type = 'system_alert';
    }

    if (!prisma.notification) {
      return NextResponse.json({ items: [], unreadCount: 0 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: "system", isRead: false }
    });

    const items = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      items,
      unreadCount
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
