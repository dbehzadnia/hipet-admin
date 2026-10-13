import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Badge, Container } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, FilterBar, Loading, Section, SelectFilter, useLoad } from "../../components/Common/HiPet"
import { AMBASSADOR_LEVELS, listReferrals } from "../../services/clinics"
import { num } from "../../utils/format"

const Referrals = () => {
  document.title = "معرفی‌ها و سفیران | های‌پت"
  const [list] = useLoad(listReferrals)
  const [level, setLevel] = useState("")
  const rows = useMemo(() => (list || []).filter(r => !level || r.ambassador?.level === level), [list, level])

  const columns = useMemo(() => [
    { header: "کلینیک معرف", accessorKey: "name", enableSorting: true, cell: ({ row: { original: r } }) => <Link to={`/clinics/${r.id}?tab=referrals`}>{r.name}</Link> },
    { header: "سطح سفیر", accessorFn: r => r.ambassador?.level || "", id: "level", enableSorting: true, cell: c => c.getValue() ? <Badge color="warning">{c.getValue()}</Badge> : "—" },
    { header: "تعداد معرفی", accessorFn: r => r.referred.length, id: "count", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "معرفی‌های فعال", accessorFn: r => r.referred.filter(x => x.active).length, id: "active", enableSorting: true, cell: c => num(c.getValue()) },
    {
      header: "کلینیک‌های معرفی‌شده", accessorFn: r => r.referred.map(x => x.name).join("، "), id: "names",
      cell: ({ row: { original: r } }) => <div className="d-flex flex-wrap gap-1" style={{ whiteSpace: "normal" }}>{r.referred.map(x => <Link key={x.id} to={`/clinics/${x.id}`} className="badge bg-light text-dark">{x.name}</Link>)}</div>,
    },
  ], [])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="کلینیک‌ها" breadcrumbItem="معرفی‌ها (سفیران)" />
        <Section title="پیگیری معرفی کلینیک‌ها">
          <FilterBar>
            <SelectFilter value={level} onChange={setLevel} placeholder="همه سطوح سفیر" options={AMBASSADOR_LEVELS.map(l => ({ value: l, text: l }))} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی نام کلینیک..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default Referrals
