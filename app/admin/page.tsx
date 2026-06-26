import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
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

  const [unconfirmed, confirmed] = await Promise.all([
    db.select().from(events).where(eq(events.confirmed, false)).orderBy(desc(events.createdAt)),
    db.select().from(events).where(eq(events.confirmed, true)).orderBy(desc(events.createdAt)),
  ]);

  // Confirmed: events ohne Bild zuerst
  const sortedConfirmed = [
    ...confirmed.filter((e) => !e.imageUrl),
    ...confirmed.filter((e) => e.imageUrl),
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-poppins font-bold text-3xl text-primary-text">
            Admin
          </h1>
          <p className="font-inter text-secondary-text mt-1">
            {unconfirmed.length} zu bestätigen · {confirmed.length} bestätigt
          </p>
        </div>
        <AdminClient
          unconfirmed={unconfirmed}
          confirmed={sortedConfirmed}
          crawlSecret={secret}
        />
      </div>
    </main>
  );
}
