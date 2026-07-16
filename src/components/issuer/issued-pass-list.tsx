import { StatusBadge } from "@/components/status-badge";
import { PassActions } from "@/components/issuer/pass-actions";
import { formatDate, shortenAddress } from "@/lib/chain/format";
import type { IssuedPass } from "@/lib/chain/records";

export function IssuedPassList({ passes }: { passes: IssuedPass[] }) {
  if (passes.length === 0) return null;
  return (
    <section aria-labelledby="issued-passes-heading">
      <div className="mb-4">
        <p className="font-mono text-xs font-bold tracking-[0.14em] text-violet uppercase">Members</p>
        <h2 id="issued-passes-heading" className="mt-1 text-2xl font-black tracking-tight">Issued passes</h2>
      </div>
      <div className="overflow-hidden rounded-[1.4rem] border border-line bg-white/80 shadow-[0_18px_55px_rgb(17_18_23/6%)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs tracking-wide text-ink-soft uppercase">
              <tr>
                <th className="px-5 py-3 font-bold">Pass</th>
                <th className="px-5 py-3 font-bold">Holder</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Expires</th>
                <th className="px-5 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {passes.map((item) => (
                <tr key={item.id.toString()} className="transition hover:bg-paper/65">
                  <td className="px-5 py-4">
                    <p className="font-bold">{item.programName}</p>
                    <p className="mt-1 font-mono text-xs text-ink-soft">#{item.id.toString()}</p>
                  </td>
                  <td className="px-5 py-4 font-mono">{shortenAddress(item.pass.holder, 5)}</td>
                  <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                  <td className="px-5 py-4 whitespace-nowrap">{formatDate(item.pass.expiresAt)}</td>
                  <td className="px-5 py-4"><PassActions passId={item.id} revoked={item.pass.revoked} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
