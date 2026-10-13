import React, { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Button, Col, Container, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { ConfirmModal, DataTable, InfoList, Loading, Section, Status, run, useLoad } from "../../components/Common/HiPet"
import ContactHistory from "../Support/ContactHistory"
import { getOwner, setOwnerBlocked } from "../../services/owners"
import { canEdit, canView } from "../../services/admins"
import { faDigits, jdate, jdatetime, num, toman } from "../../utils/format"

const OwnerDetail = () => {
  const { id } = useParams()
  const [o, reload] = useLoad(() => getOwner(id), [id])
  const [blocking, setBlocking] = useState(false)
  document.title = `${o?.name || "کاربر"} | های‌پت`

  const apptColumns = useMemo(() => [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => canView("appointments") ? <Link to={`/appointments/${c.getValue()}`}>{faDigits(c.getValue())}</Link> : faDigits(c.getValue()) },
    { header: "زمان", accessorKey: "datetime", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "حیوان", accessorKey: "petName" },
    { header: "کلینیک", accessorKey: "clinicName" },
    { header: "خدمت", accessorKey: "serviceName" },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="appointment" value={c.getValue()} /> },
  ], [])
  const payColumns = useMemo(() => [
    { header: "تراکنش", accessorKey: "id", cell: c => faDigits(c.getValue()) },
    { header: "تاریخ", accessorKey: "date", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "کلینیک", accessorKey: "clinicName" },
    { header: "درگاه", accessorKey: "gateway" },
    { header: "مبلغ", accessorKey: "amount", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="tx" value={c.getValue()} /> },
  ], [])

  if (!o) return <div className="page-content"><Loading /></div>
  const editable = canEdit("owners")

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="کاربران پت" breadcrumbItem={o.name} />
        {o.blocked && <Alert color="danger">این کاربر مسدود است.{o.blockReason && ` دلیل: ${o.blockReason}`}</Alert>}
        <Row>
          <Col lg={5}>
            <Section title="اطلاعات کاربر" actions={editable && (
              o.blocked
                ? <Button size="sm" color="success" onClick={() => run(setOwnerBlocked(o.id, false), "کاربر رفع مسدودی شد", reload)}>رفع مسدودی</Button>
                : <Button size="sm" color="danger" onClick={() => setBlocking(true)}>مسدودسازی</Button>
            )}>
              <InfoList items={[
                ["نام", o.name], ["موبایل", <span key="p" dir="ltr">{faDigits(o.phone)}</span>], ["شهر", o.cityName],
                ["تاریخ عضویت", jdate(o.createdAt)], ["تعداد نوبت", num(o.appointmentCount)], ["مجموع پرداخت موفق", toman(o.totalPaid)],
              ]} />
            </Section>
          </Col>
          <Col lg={7}>
            <Section title={`حیوانات (${num(o.pets.length)})`}>
              {o.pets.map(p => (
                <div key={p.id} className="border rounded p-3 mb-3">
                  <h5 className="font-size-15 mb-1">{p.name} <small className="text-muted">{p.species} - {p.breed} - تولد {jdate(p.birthDate)}</small></h5>
                  {p.records.length ? (
                    <Table size="sm" className="mb-0 mt-2">
                      <thead className="table-light"><tr><th>تاریخ</th><th>سابقه</th><th>توضیح</th></tr></thead>
                      <tbody>{[...p.records].sort((a, b) => b.date.localeCompare(a.date)).map((r, i) => <tr key={i}><td>{jdate(r.date)}</td><td>{r.title}</td><td>{r.note || "—"}</td></tr>)}</tbody>
                    </Table>
                  ) : <p className="text-muted mb-0 mt-2">سابقه پزشکی ثبت نشده است.</p>}
                </div>
              ))}
            </Section>
          </Col>
        </Row>
        <Section title="نوبت‌ها"><DataTable columns={apptColumns} data={o.appointments} /></Section>
        <Section title="پرداخت‌ها"><DataTable columns={payColumns} data={o.payments} /></Section>
        <ContactHistory type="owner" id={o.id} />
      </Container>
      <ConfirmModal isOpen={blocking} title={`مسدودسازی ${o.name}`} color="danger" confirmText="مسدودسازی" reasonLabel="دلیل مسدودسازی"
        text="کاربر مسدود امکان ورود و رزرو نوبت نخواهد داشت."
        onClose={() => setBlocking(false)}
        onConfirm={async reason => { if (await run(setOwnerBlocked(o.id, true, reason), "کاربر مسدود شد", reload)) setBlocking(false) }} />
    </div>
  )
}

export default OwnerDetail
