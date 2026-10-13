import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Badge, Container } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, FilterBar, Loading, Section, SelectFilter, Status, useLoad } from "../../components/Common/HiPet"
import { AMBASSADOR_LEVELS, listClinics } from "../../services/clinics"
import { CITIES } from "../../services/db"
import { faDigits, jdate, num, options } from "../../utils/format"

/** Clinics list; with `requests` it becomes the registration-request queue. */
const ClinicsList = ({ requests }) => {
  document.title = `${requests ? "درخواست‌های ثبت‌نام کلینیک" : "کلینیک‌ها"} | های‌پت`
  const [params] = useSearchParams()
  const [list] = useLoad(listClinics)
  const [city, setCity] = useState("")
  const [active, setActive] = useState("")
  const [reg, setReg] = useState(params.get("status") || "")
  const [amb, setAmb] = useState("")

  const rows = useMemo(() => (list || []).filter(c =>
    (!requests || c.registration.status !== "approved") &&
    (!city || c.cityId === Number(city)) && (active === "" || String(c.active) === active) &&
    (!reg || c.registration.status === reg) &&
    (!amb || (amb === "none" ? !c.ambassador : c.ambassador?.level === amb))), [list, requests, city, active, reg, amb])

  const columns = useMemo(() => requests ? [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => faDigits(c.getValue()) },
    { header: "نام کلینیک", accessorKey: "name", enableSorting: true, cell: ({ row: { original: c } }) => <Link to={`/clinics/${c.id}`}>{c.name}</Link> },
    { header: "شهر", accessorKey: "cityName", enableSorting: true },
    { header: "مسئول فنی", accessorFn: c => c.techDirector.name, id: "td" },
    { header: "تاریخ ثبت", accessorFn: c => c.registration.submittedAt, id: "submitted", enableSorting: true, cell: c => jdate(c.getValue()) },
    { header: "مدارک تأییدشده", accessorFn: c => c.registration.documents.filter(d => d.status === "approved").length, id: "docs", cell: ({ row: { original: c } }) => `${num(c.registration.documents.filter(d => d.status === "approved").length)} از ${num(c.registration.documents.length)}` },
    { header: "وضعیت", accessorFn: c => c.registration.status, id: "status", cell: c => <Status group="registration" value={c.getValue()} /> },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/clinics/${row.original.id}?tab=registration`} className="btn btn-sm btn-primary">بررسی</Link> },
  ] : [
    { header: "رتبه نمایش", accessorKey: "rank", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "نام کلینیک", accessorKey: "name", enableSorting: true, cell: ({ row: { original: c } }) => <Link to={`/clinics/${c.id}`}>{c.name}</Link> },
    { header: "شهر / منطقه", accessorFn: c => `${c.cityName} - ${c.region}`, id: "city", enableSorting: true },
    { header: "مسئول فنی", accessorFn: c => c.techDirector.name, id: "td" },
    { header: "دامپزشکان", accessorKey: "vetCount", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "سفیر", accessorFn: c => c.ambassador?.level || "", id: "amb", cell: c => c.getValue() ? <Badge color="warning">سفیر {c.getValue()}</Badge> : "—" },
    { header: "ثبت‌نام", accessorFn: c => c.registration.status, id: "reg", cell: c => <Status group="registration" value={c.getValue()} /> },
    { header: "وضعیت", accessorKey: "active", cell: c => <Status group="active" value={c.getValue()} /> },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/clinics/${row.original.id}`} className="btn btn-sm btn-light">جزئیات</Link> },
  ], [requests])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="کلینیک‌ها" breadcrumbItem={requests ? "درخواست‌های ثبت‌نام" : "لیست کلینیک‌ها"} />
        <Section title={requests ? "صف درخواست‌های ثبت‌نام" : "لیست کلینیک‌ها"}>
          <FilterBar>
            <SelectFilter value={reg} onChange={setReg} placeholder="همه وضعیت‌های ثبت‌نام"
              options={options("registration").filter(o => !requests || o.value !== "approved")} />
            <SelectFilter value={city} onChange={setCity} placeholder="همه شهرها" options={CITIES.map(c => ({ value: c.id, text: c.name }))} />
            {!requests && <SelectFilter value={active} onChange={setActive} placeholder="فعال و غیرفعال" options={[{ value: "true", text: "فعال" }, { value: "false", text: "غیرفعال" }]} />}
            {!requests && <SelectFilter value={amb} onChange={setAmb} placeholder="وضعیت سفیر" options={[{ value: "none", text: "غیرسفیر" }, ...AMBASSADOR_LEVELS.map(l => ({ value: l, text: `سفیر ${l}` }))]} />}
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی نام کلینیک، شهر، مسئول فنی..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default ClinicsList
