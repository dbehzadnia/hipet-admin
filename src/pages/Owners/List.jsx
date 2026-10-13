import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Container } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, Loading, Section, SelectFilter, useLoad } from "../../components/Common/HiPet"
import { listOwners } from "../../services/owners"
import { CITIES } from "../../services/db"
import { faDigits, inRange, jdate, num, toman } from "../../utils/format"

const OwnersList = () => {
  document.title = "کاربران پت | های‌پت"
  const [list] = useLoad(listOwners)
  const [city, setCity] = useState("")
  const [blocked, setBlocked] = useState("")
  const [range, setRange] = useState([null, null])

  const rows = useMemo(() => (list || []).filter(o =>
    (!city || o.cityId === Number(city)) && (blocked === "" || String(o.blocked) === blocked) && inRange(o.createdAt, range)),
  [list, city, blocked, range])

  const columns = useMemo(() => [
    { header: "نام", accessorKey: "name", enableSorting: true, cell: ({ row: { original: o } }) => <Link to={`/owners/${o.id}`}>{o.name}</Link> },
    { header: "موبایل", accessorKey: "phone", cell: c => <span dir="ltr">{faDigits(c.getValue())}</span> },
    { header: "شهر", accessorKey: "cityName", enableSorting: true },
    { header: "حیوانات", accessorKey: "petCount", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "نوبت‌ها", accessorKey: "appointmentCount", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "مجموع پرداخت", accessorKey: "totalPaid", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "تاریخ عضویت", accessorKey: "createdAt", enableSorting: true, cell: c => jdate(c.getValue()) },
    { header: "وضعیت", accessorKey: "blocked", cell: c => <span className={`badge badge-soft-${c.getValue() ? "danger" : "success"}`}>{c.getValue() ? "مسدود" : "فعال"}</span> },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/owners/${row.original.id}`} className="btn btn-sm btn-light">جزئیات</Link> },
  ], [])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="کاربران پت" />
        <Section title="لیست کاربران">
          <FilterBar>
            <SelectFilter value={city} onChange={setCity} placeholder="همه شهرها" options={CITIES.map(c => ({ value: c.id, text: c.name }))} />
            <SelectFilter value={blocked} onChange={setBlocked} placeholder="همه وضعیت‌ها" options={[{ value: "false", text: "فعال" }, { value: "true", text: "مسدود" }]} />
            <DateRange value={range} onChange={setRange} placeholder="بازه تاریخ عضویت" />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی نام یا موبایل..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default OwnersList
