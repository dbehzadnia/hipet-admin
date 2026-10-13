import React, { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { Button, Col, Container, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, InfoList, Loading, Section, StatCard, Status, run, useLoad } from "../../components/Common/HiPet"
import ContactHistory from "../Support/ContactHistory"
import { getVet, setVetBooking, setVetDocument, setVetVerification } from "../../services/vets"
import { canEdit, canView } from "../../services/admins"
import { faDigits, jdate, jdatetime, num, toman } from "../../utils/format"

const VetDetail = () => {
  const { id } = useParams()
  const [v, reload] = useLoad(() => getVet(id), [id])
  const editable = canEdit("vets")
  document.title = `${v?.name || "دامپزشک"} | های‌پت`

  const columns = useMemo(() => [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => canView("appointments") ? <Link to={`/appointments/${c.getValue()}`}>{faDigits(c.getValue())}</Link> : faDigits(c.getValue()) },
    { header: "زمان", accessorKey: "datetime", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "کلینیک", accessorKey: "clinicName" },
    { header: "صاحب حیوان", accessorKey: "ownerName" },
    { header: "خدمت", accessorKey: "serviceName" },
    { header: "مبلغ", accessorKey: "price", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="appointment" value={c.getValue()} /> },
  ], [])

  if (!v) return <div className="page-content"><Loading /></div>
  const ver = v.verification

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="دامپزشکان" breadcrumbItem={v.name} />
        <Row>
          <Col md={3}><StatCard title="تعداد ویزیت" value={num(v.visits)} icon="bx-check-circle" color="success" /></Col>
          <Col md={3}><StatCard title="درآمد (ویزیت‌های انجام‌شده)" value={toman(v.revenue)} icon="bx-money" /></Col>
          <Col md={3}><StatCard title="امتیاز" value={v.rating ? `${num(v.rating)} از ۵` : "—"} hint={`${num(v.ratingCount)} نظر`} icon="bx-star" color="warning" /></Col>
          <Col md={3}><StatCard title="تعداد لغو" value={num(v.cancellations)} icon="bx-x-circle" color="danger" /></Col>
        </Row>
        <Row>
          <Col lg={6}>
            <Section title="اطلاعات دامپزشک" actions={editable && (
              <Button size="sm" color={v.bookingEnabled ? "danger" : "success"} disabled={!v.bookingEnabled && ver.status !== "approved"}
                onClick={() => run(setVetBooking(v.id, !v.bookingEnabled), v.bookingEnabled ? "نوبت‌دهی غیرفعال شد" : "نوبت‌دهی فعال شد", reload)}>
                {v.bookingEnabled ? "غیرفعال‌سازی نوبت‌دهی" : "فعال‌سازی نوبت‌دهی"}
              </Button>
            )}>
              <InfoList items={[
                ["نام", v.name], ["کد نظام دامپزشکی", faDigits(v.nezamCode)], ["موبایل", <span key="p" dir="ltr">{faDigits(v.phone)}</span>],
                ["نوبت‌دهی", <Status key="b" group="active" value={v.bookingEnabled} />], ["تاریخ عضویت", jdate(v.createdAt)],
                ["کلینیک‌ها", v.clinics.length ? v.clinics.map((c, i) => <React.Fragment key={c.id}>{i > 0 && "، "}{canView("clinics") ? <Link to={`/clinics/${c.id}`}>{c.name}</Link> : c.name}</React.Fragment>) : "—"],
              ]} />
            </Section>
          </Col>
          <Col lg={6}>
            <Section title="تأیید مدارک" actions={<Status group="vetVerification" value={ver.status} />}>
              <div className="table-responsive">
                <Table className="align-middle table-nowrap mb-0">
                  <tbody>
                    {ver.documents.map(d => (
                      <tr key={d.id}>
                        <td><i className="bx bx-file me-1" />{d.title}</td>
                        <td><Status group="doc" value={d.status} /></td>
                        {editable && (
                          <td className="text-end">
                            <Button size="sm" color="success" outline className="me-2" disabled={d.status === "approved"} onClick={() => run(setVetDocument(v.id, d.id, "approved"), "مدرک تأیید شد", reload)}>تأیید</Button>
                            <Button size="sm" color="danger" outline disabled={d.status === "rejected"} onClick={() => run(setVetDocument(v.id, d.id, "rejected"), "مدرک رد شد", reload)}>رد</Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {editable && (
                <div className="d-flex gap-2 mt-3">
                  <Button color="success" disabled={ver.status === "approved"} onClick={() => run(setVetVerification(v.id, "approved"), "دامپزشک تأیید شد", reload)}>تأیید دامپزشک</Button>
                  <Button color="danger" outline disabled={ver.status === "rejected"} onClick={() => run(setVetVerification(v.id, "rejected"), "دامپزشک رد شد", reload)}>رد دامپزشک</Button>
                </div>
              )}
            </Section>
          </Col>
        </Row>
        <Section title="سابقه ویزیت‌ها">
          <DataTable columns={columns} data={v.appointments} SearchPlaceholder="جستجو در ویزیت‌ها..." />
        </Section>
        <ContactHistory type="vet" id={v.id} />
      </Container>
    </div>
  )
}

export default VetDetail
