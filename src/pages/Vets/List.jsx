import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Container } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, FilterBar, Loading, Section, SelectFilter, Status, useLoad } from "../../components/Common/HiPet"
import { listVets } from "../../services/vets"
import { getLookups } from "../../services/appointments"
import { faDigits, num, options, toman } from "../../utils/format"

const VetsList = () => {
  document.title = "دامپزشکان | های‌پت"
  const [params] = useSearchParams()
  const [list] = useLoad(listVets)
  const [lookups] = useLoad(getLookups)
  const [clinic, setClinic] = useState("")
  const [verification, setVerification] = useState(params.get("verification") || "")
  const [booking, setBooking] = useState("")

  const rows = useMemo(() => (list || []).filter(v =>
    (!clinic || v.clinicIds.includes(Number(clinic))) && (!verification || v.verification.status === verification) &&
    (booking === "" || String(v.bookingEnabled) === booking)), [list, clinic, verification, booking])

  const columns = useMemo(() => [
    { header: "نام", accessorKey: "name", enableSorting: true, cell: ({ row: { original: v } }) => <Link to={`/vets/${v.id}`}>{v.name}</Link> },
    { header: "کد نظام", accessorKey: "nezamCode", cell: c => faDigits(c.getValue()) },
    { header: "کلینیک‌ها", accessorFn: v => v.clinicNames.join("، "), id: "clinics" },
    { header: "تعداد ویزیت", accessorKey: "visits", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "درآمد", accessorKey: "revenue", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "امتیاز", accessorFn: v => v.rating ?? 0, id: "rating", enableSorting: true, cell: ({ row: { original: v } }) => v.rating ? `${num(v.rating)} از ۵` : "—" },
    { header: "لغو", accessorKey: "cancellations", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "مدارک", accessorFn: v => v.verification.status, id: "ver", cell: c => <Status group="vetVerification" value={c.getValue()} /> },
    { header: "نوبت‌دهی", accessorKey: "bookingEnabled", cell: c => <Status group="active" value={c.getValue()} /> },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/vets/${row.original.id}`} className="btn btn-sm btn-light">جزئیات</Link> },
  ], [])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="دامپزشکان" />
        <Section title="لیست دامپزشکان">
          <FilterBar>
            <SelectFilter value={verification} onChange={setVerification} placeholder="همه وضعیت‌های مدارک" options={options("vetVerification")} />
            <SelectFilter value={clinic} onChange={setClinic} placeholder="همه کلینیک‌ها" options={(lookups?.clinics || []).map(c => ({ value: c.id, text: c.name }))} />
            <SelectFilter value={booking} onChange={setBooking} placeholder="وضعیت نوبت‌دهی" options={[{ value: "true", text: "نوبت‌دهی فعال" }, { value: "false", text: "نوبت‌دهی غیرفعال" }]} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی نام، کد نظام، کلینیک..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default VetsList
