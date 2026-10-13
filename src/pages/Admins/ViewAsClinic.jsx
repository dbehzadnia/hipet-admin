import React, { useEffect, useRef } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Col, Container, Row, Table } from "reactstrap"
import { InfoList, Loading, Section, StatCard, Status, useLoad } from "../../components/Common/HiPet"
import { getClinic } from "../../services/clinics"
import { logViewAsClinic } from "../../services/admins"
import { faDigits, jdatetime, num } from "../../utils/format"

// shortcut: read-only mock of the clinic panel built from admin data; link to the real clinic panel once it exists.
const ViewAsClinic = () => {
  const { id } = useParams()
  const [c] = useLoad(() => getClinic(id), [id])
  const logged = useRef(null)
  useEffect(() => {
    // Every use is audit-logged (once per opened clinic, not per re-render).
    if (c && logged.current !== c.id) { logged.current = c.id; logViewAsClinic(c) }
  }, [c])
  document.title = "مشاهده به‌عنوان کلینیک | های‌پت"
  if (!c) return <div className="page-content"><Loading /></div>

  const upcoming = c.recentAppointments.filter(a => ["pending", "confirmed"].includes(a.status))
  return (
    <div className="page-content">
      <Container fluid>
        <Alert color="warning" className="d-flex align-items-center justify-content-between">
          <span><i className="bx bx-show me-1" />حالت فقط‌خواندنی: پنل «{c.name}» را همان‌طور که کلینیک می‌بیند مشاهده می‌کنید. این مشاهده در گزارش تغییرات ثبت شد.</span>
          <Link to={`/clinics/${c.id}`} className="btn btn-sm btn-dark">خروج</Link>
        </Alert>
        <fieldset disabled>
          <Row>
            <Col md={4}><StatCard title="نوبت‌های پیش‌رو" value={num(upcoming.length)} icon="bx-calendar" /></Col>
            <Col md={4}><StatCard title="دامپزشکان" value={num(c.vets.length)} icon="bx-plus-medical" color="info" /></Col>
            <Col md={4}><StatCard title="کل نوبت‌ها" value={num(c.appointmentCount)} icon="bx-list-check" color="success" /></Col>
          </Row>
          <Row>
            <Col lg={5}>
              <Section title="پروفایل کلینیک">
                <InfoList items={[["نام", c.name], ["تلفن", <span key="p" dir="ltr">{faDigits(c.phone)}</span>], ["آدرس", c.address], ["مسئول فنی", c.techDirector.name], ["کارکنان", c.staff.map(s => s.name).join("، ")]]} />
              </Section>
            </Col>
            <Col lg={7}>
              <Section title="نوبت‌های اخیر">
                <div className="table-responsive">
                  <Table className="table-nowrap mb-0">
                    <thead className="table-light"><tr><th>شناسه</th><th>زمان</th><th>صاحب حیوان</th><th>دامپزشک</th><th>وضعیت</th></tr></thead>
                    <tbody>
                      {c.recentAppointments.map(a => (
                        <tr key={a.id}><td>{faDigits(a.id)}</td><td>{jdatetime(a.datetime)}</td><td>{a.ownerName}</td><td>{a.vetName}</td><td><Status group="appointment" value={a.status} /></td></tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Section>
            </Col>
          </Row>
        </fieldset>
      </Container>
    </div>
  )
}

export default ViewAsClinic
