import { NextRequest } from "next/server";
import { FoodController } from "@/src/controllers/food.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  return FoodController.addVariation(req, (await params).id);
}