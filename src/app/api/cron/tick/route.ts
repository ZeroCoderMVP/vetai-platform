import { NextResponse } from "next/server";
import { CronService } from "@/lib/services/cron.service";

export async function POST(request: Request) {
  try {
    // In production, you would check an authorization header here matching your cron scheduler secret
    
    const overdueCount = await CronService.processOverdueOperations();
    
    // We optionally capture snapshots if farmId is passed, or iterate all farms
    // For MVP, we will just return success for overdue processing
    
    return NextResponse.json({ success: true, overdueCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
