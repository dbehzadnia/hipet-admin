import React, { useMemo, useState } from "react"
import { Button, Col, Container, Modal, ModalBody, ModalHeader, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, InfoList, Loading, Section, SelectFilter, useLoad } from "../../components/Common/HiPet"
import { SECTIONS, listAdmins, listAudit } from "../../services/admins"
import { inRange, jdatetime } from "../../utils/format"

// Flattens a record into "field → value" lines for the before/after diff.
const flat = (o, prefix = "") => Object.entries(o || {}).flatMap(([k, v]) =>
  v && typeof v === "object" && !Array.isArray(v) ? flat(v, `${prefix}${k}.`) : [[prefix + k, JSON.stringify(v)]])

const Diff = ({ before, after }) => {
  const b = Object.fromEntries(flat(before)), a = Object.fromEntries(flat(after))
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter(k => b[k] !== a[k])
  if (!keys.length) return <p className="text-muted mb-0">مقداری تغییر نکرده یا این رویداد مقدار قبل/بعد ندارد.</p>
  return (
    <div className="table-responsive">
      <Table size="sm" bordered className="mb-0">
        <thead className="table-light"><tr><th>فیلد</th><th>قبل</th><th>بعد</th></tr></thead>
        <tbody>
          {keys.map(k => (
            <tr key={k}>
              <td dir="ltr" className="text-start">{k}</td>
              <td dir="ltr" className="text-start text-danger text-break">{b[k] ?? "—"}</td>
              <td dir="ltr" className="text-start text-success text-break">{a[k] ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

const AuditLog = () => {
  document.title = "گزارش تغییرات | های‌پت"
  const [log] = useLoad(listAudit)
  const [admins] = useLoad(listAdmins)
  const [admin, setAdmin] = useState("")
  const [section, setSection] = useState("")
  const [range, setRange] = useState([null, null])
  const [view, setView] = useState(null)

  const rows = useMemo(() => (log || []).filter(e =>
    (!admin || e.adminId === Number(admin)) && (!section || e.section === section) && inRange(e.date, range)), [log, admin, section, range])

  const columns = useMemo(() => [
    { header: "زمان", accessorKey: "date", cell: c => jdatetime(c.getValue()), enableSorting: true },
    { header: "ادمین", accessorKey: "adminName", enableSorting: true },
    { header: "بخش", accessorFn: e => SECTIONS[e.section] || e.section, id: "section", enableSorting: true },
    { header: "عملیات", accessorKey: "action", enableSorting: true },
    { header: "رکورد", accessorFn: e => `${e.entityLabel} (${e.entityId ?? "—"})`, id: "entity" },
    { header: "", id: "view", enableSorting: false, cell: ({ row }) => <Button size="sm" color="light" onClick={() => setView(row.original)}>جزئیات</Button> },
  ], [])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="مدیریت ادمین‌ها" breadcrumbItem="گزارش تغییرات" />
        <Section title="گزارش تغییرات (فقط خواندنی)">
          <FilterBar>
            <SelectFilter value={admin} onChange={setAdmin} placeholder="همه ادمین‌ها" options={(admins || []).map(a => ({ value: a.id, text: a.name }))} />
            <SelectFilter value={section} onChange={setSection} placeholder="همه بخش‌ها" options={Object.entries(SECTIONS).map(([value, text]) => ({ value, text }))} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {log ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجو در عملیات و رکورد..." /> : <Loading />}
        </Section>
      </Container>

      <Modal isOpen={!!view} toggle={() => setView(null)} size="lg" centered>
        <ModalHeader toggle={() => setView(null)}>جزئیات تغییر</ModalHeader>
        <ModalBody>
          {view && (
            <Row className="g-3">
              <Col md={12}>
                <InfoList items={[["زمان", jdatetime(view.date)], ["ادمین", view.adminName], ["بخش", SECTIONS[view.section]], ["عملیات", view.action], ["نوع رکورد", view.entityType], ["رکورد", `${view.entityLabel} (${view.entityId ?? "—"})`]]} />
              </Col>
              <Col md={12}><h6>تغییرات</h6><Diff before={view.before} after={view.after} /></Col>
            </Row>
          )}
        </ModalBody>
      </Modal>
    </div>
  )
}

export default AuditLog
