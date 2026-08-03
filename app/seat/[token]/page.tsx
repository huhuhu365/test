import { notFound } from "next/navigation";
import OrderingApp from "../../components/OrderingApp";
import { getTableByToken } from "../../table-config";

export default async function SeatPage({ params }: { params: Promise<{ token: string }> }) {
  const table = getTableByToken((await params).token);
  if (!table) notFound();
  return <OrderingApp tableNumber={table.number} seatToken={table.token} />;
}
