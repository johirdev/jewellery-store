import { NextRequest } from "next/server";
import { FoodController } from "@/src/controllers/food.controller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return FoodController.getFoodById((await params).id);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return FoodController.updateFood(req, (await params).id);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return FoodController.deleteFood(req, (await params).id);
}