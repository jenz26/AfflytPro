import { Check, X } from 'lucide-react';

interface TableRow {
  aspect: string;
  traditional: string;
  afflyt: string;
}

interface LandingTableProps {
  rows: TableRow[];
}

export function LandingTable({ rows }: LandingTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-afflyt-glass-white backdrop-blur-md border border-white/10">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-6 font-space-grotesk font-semibold text-gray-400 w-1/4">
              Aspetto
            </th>
            <th className="text-left py-4 px-6 font-space-grotesk font-semibold text-gray-500 w-[37.5%]">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-400" />
                Bot Tradizionali
              </div>
            </th>
            <th className="text-left py-4 px-6 font-space-grotesk font-semibold text-afflyt-cyan-500 bg-afflyt-cyan-500/5 w-[37.5%]">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-afflyt-cyan-500" />
                Afflyt
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors">
              <td className="py-4 px-6 font-medium text-white text-sm">
                {row.aspect}
              </td>
              <td className="py-4 px-6 text-gray-500 text-sm">
                {row.traditional}
              </td>
              <td className="py-4 px-6 text-white text-sm bg-afflyt-cyan-500/5">
                {row.afflyt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
