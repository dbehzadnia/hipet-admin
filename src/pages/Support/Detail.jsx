import React, { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Button, Col, Container, Form, Input, Label, Row } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { InfoList, Loading, Section, Status, run, useLoad } from "../../components/Common/HiPet"
import { getTicket, replyTicket, updateTicket } from "../../services/support"
import { canEdit, canView } from "../../services/admins"
import { faDigits, jdatetime, label, options } from "../../utils/format"

const PROFILE = { owner: ["owners", "/owners/"], clinic: ["clinics", "/clinics/"], vet: ["vets", "/vets/"] }

const TicketDetail = () => {
  const { id } = useParams()
  const [t, reload] = useLoad(() => getTicket(id), [id])
  const [text, setText] = useState("")
  document.title = `تیکت ${faDigits(id)} | های‌پت`
  if (!t) return <div className="page-content"><Loading /></div>
  const editable = canEdit("support")
  const [section, path] = PROFILE[t.senderType]

  const send = async e => {
    e.preventDefault()
    if (await run(replyTicket(t.id, text), "پاسخ ارسال شد", reload)) setText("")
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="پشتیبانی" breadcrumbItem={`تیکت ${faDigits(t.id)}`} />
        <Row>
          <Col lg={8}>
            <Section title={t.subject}>
              <div className="d-flex flex-column gap-3 mb-4">
                {t.messages.map((m, i) => (
                  <div key={i} className={`p-3 rounded ${m.from === "admin" ? "bg-primary-subtle ms-5" : "bg-light me-5"}`}>
                    <div className="d-flex justify-content-between mb-1">
                      <strong>{m.from === "admin" ? `${m.adminName || "ادمین"} (پشتیبانی های‌پت)` : t.senderName}</strong>
                      <small className="text-muted">{jdatetime(m.date)}</small>
                    </div>
                    <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
                  </div>
                ))}
              </div>
              {editable && t.status !== "closed" && (
                <Form onSubmit={send}>
                  <Label for="reply">پاسخ ادمین</Label>
                  <Input id="reply" type="textarea" rows={4} value={text} onChange={e => setText(e.target.value)} />
                  <div className="text-end mt-2"><Button color="primary" type="submit" disabled={!text.trim()}><i className="bx bx-send me-1" />ارسال پاسخ</Button></div>
                </Form>
              )}
            </Section>
          </Col>
          <Col lg={4}>
            <Section title="اطلاعات تیکت">
              <InfoList items={[
                ["فرستنده", canView(section) ? <Link key="s" to={path + t.senderId}>{t.senderName}</Link> : t.senderName],
                ["نوع فرستنده", label("sender", t.senderType)],
                ["ایجاد", jdatetime(t.createdAt)],
                ["وضعیت", <Status key="st" group="ticket" value={t.status} />],
                ["اولویت", <Status key="p" group="priority" value={t.priority} />],
              ]} />
              {editable && (
                <Row className="g-2 mt-2">
                  <Col sm={6}>
                    <Label for="t-status">تغییر وضعیت</Label>
                    <Input id="t-status" type="select" value={t.status} onChange={e => run(updateTicket(t.id, { status: e.target.value }), "وضعیت تیکت تغییر کرد", reload)}>
                      {options("ticket").map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
                    </Input>
                  </Col>
                  <Col sm={6}>
                    <Label for="t-pri">تغییر اولویت</Label>
                    <Input id="t-pri" type="select" value={t.priority} onChange={e => run(updateTicket(t.id, { priority: e.target.value }), "اولویت تیکت تغییر کرد", reload)}>
                      {options("priority").map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
                    </Input>
                  </Col>
                </Row>
              )}
            </Section>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default TicketDetail
