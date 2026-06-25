import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { AdminClient } from "./AdminClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const secret = process.env.CRAWL_SECRET;
  if (!secret || searchParams.key !== secret) {
    redirect("/");
  }

  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt));

  // Events ohne Bild zuerst
  const sorted = [
    ...allEvents.filter((e) => !e.imageUrl),
    ...allEvents.filter((e) => e.imageUrl),
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-3xl text-primary-text">
            Admin — Events bearbeiten
          </h1>
          <p className="font-inter text-secondary-text mt-1">
            {sorted.filter((e) => !e.imageUrl).length} ohne Bild ·{" "}
            {sorted.length} gesamt
          </p>
        </div>
        <AdminClient events={sorted} crawlSecret={secret} />
      </div>
    </main>
  );
}
