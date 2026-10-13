import React, { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Alert, Badge, Button, Col, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { ConfirmModal, DateInput, InfoList, Loading, Section, Status, run, useLoad } from "../../components/Common/HiPet"
import { cancelAppointment, getAppointment, rescheduleAppointment } from "../../services/appointments"
import { canEdit, canView } from "../../services/admins"
import { faDigits, jdatetime, toman } from "../../utils/format"

const maybeLink = (section, to, text) => canView(section) ? <Link to={to}>{text}</Link> : text

const AppointmentDetail = () => {
  const { id } = useParams()
  const [a, reload] = useLoad(() => getAppointment(id), [id])
  const [moving, setMoving] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  document.title = `نوبت ${faDigits(id)} | های‌پت`
  if (!a) return <div className="page-content"><Loading /></div>
  const editable = canEdit("appointments") && !["cancelled", "completed"].includes(a.status)

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="نوبت‌ها" breadcrumbItem={`نوبت ${faDigits(a.id)}`} />
        {a.emergency && <Alert color="danger"><i className="bx bx-error me-1" />این نوبت اورژانسی است.</Alert>}
        <Row>
          <Col lg={7}>
            <Section title="جزئیات نوبت" actions={editable && (
              <div className="d-flex gap-2">
                <Button color="primary" outline onClick={() => setMoving(new Date(a.datetime))}>تغییر زمان</Button>
                <Button color="danger" outline onClick={() => setCancelling(true)}>لغو نوبت</Button>
              </div>
            )}>
              <InfoList items={[
                ["شناسه", faDigits(a.id)],
                ["صاحب حیوان", maybeLink("owners", `/owners/${a.ownerId}`, `${a.ownerName} (${a.ownerPhone})`)],
                ["حیوان", a.petName],
                ["کلینیک", maybeLink("clinics", `/clinics/${a.clinicId}`, a.clinicName)],
                ["دامپزشک", maybeLink("vets", `/vets/${a.vetId}`, a.vetName)],
                ["خدمت", a.serviceName],
                ["زمان", jdatetime(a.datetime)],
                ["وضعیت", <Status key="s" group="appointment" value={a.status} />],
                ...(a.cancelReason ? [["دلیل لغو", a.cancelReason]] : []),
                ["اورژانسی", a.emergency ? <Badge key="e" color="danger">بله</Badge> : "خیر"],
                ["ثبت شده در", jdatetime(a.createdAt)],
              ]} />
            </Section>
          </Col>
          <Col lg={5}>
            <Section title="پرداخت">
              <InfoList items={[
                ["مبلغ کل", toman(a.price)],
                ["بیعانه آنلاین", toman(a.deposit)],
                ["وضعیت پرداخت", <Status key="p" group="payment" value={a.paymentStatus} />],
              ]} />
              {a.transactions.length > 0 && (
                <div className="table-responsive mt-3">
                  <Table size="sm" className="mb-0">
                    <thead className="table-light"><tr><th>تراکنش</th><th>درگاه</th><th>مبلغ</th><th>وضعیت</th></tr></thead>
                    <tbody>
                      {a.transactions.map(t => (
                        <tr key={t.id}>
                          <td>{maybeLink("finance", `/finance/transactions?appointment=${a.id}`, faDigits(t.id))}</td>
                          <td>{t.gateway}</td><td>{toman(t.amount)}</td><td><Status group="tx" value={t.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Section>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={!!moving} toggle={() => setMoving(null)} centered>
        <ModalHeader toggle={() => setMoving(null)}>تغییر زمان نوبت</ModalHeader>
        <ModalBody><DateInput withTime value={moving} onChange={setMoving} /></ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setMoving(null)}>انصراف</Button>
          <Button color="primary" disabled={!moving}
            onClick={async () => { if (await run(rescheduleAppointment(a.id, moving), "زمان نوبت تغییر کرد", reload)) setMoving(null) }}>ذخیره</Button>
        </ModalFooter>
      </Modal>

      <ConfirmModal isOpen={cancelling} title="لغو نوبت" color="danger" confirmText="لغو نوبت" reasonLabel="دلیل لغو"
        text="بازگشت وجه بیعانه از بخش مالی انجام می‌شود."
        onClose={() => setCancelling(false)}
        onConfirm={async reason => { if (await run(cancelAppointment(a.id, reason), "نوبت لغو شد", reload)) setCancelling(false) }} />
    </div>
  )
}

export default AppointmentDetail
