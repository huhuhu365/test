import { notFound } from "next/navigation";
import OrderingApp from "../../components/OrderingApp";

export default async function TablePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const tableNumber = Number(number);
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) notFound();
  return <OrderingApp tableNumber={tableNumber} />;
}
