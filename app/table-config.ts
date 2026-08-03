export const TABLES = [
  { number: 1, token: "xm-a7k3p9q2" },
  { number: 2, token: "xm-f4n8w2c6" },
  { number: 3, token: "xm-r9m2v7d4" },
  { number: 4, token: "xm-k6t3x8b5" },
  { number: 5, token: "xm-p2h7j4s9" },
  { number: 6, token: "xm-c8q5n3y7" },
  { number: 7, token: "xm-v4d9k6m2" },
  { number: 8, token: "xm-b7s2f8r5" },
  { number: 9, token: "xm-y3w6p9h4" },
  { number: 10, token: "xm-n5x8c2t7" },
] as const;

export function getTableByToken(token: string) {
  return TABLES.find((table) => table.token === token) ?? null;
}
