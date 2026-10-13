import React, { useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Badge, Button, Col, Container, Form, Input, InputGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { ConfirmModal, InfoList, Loading, Section, Status, run, useLoad } from "../../components/Common/HiPet"
import ContactHistory from "../Support/ContactHistory"
import {
  AMBASSADOR_LEVELS, getClinic, setAmbassador, setClinicActive, setClinicDocument, setClinicRank, setRegistrationStatus, updateClinic,
} from "../../services/clinics"
import { canEdit, canView } from "../../services/admins"
import { faDigits, jdate, jdatetime, num, options } from "../../utils/format"

const TABS = [["info", "اطلاعات"], ["people", "کارکنان و دامپزشکان"], ["registration", "ثبت‌نام و مدارک"], ["referrals", "معرفی‌ها"], ["support", "پشتیبانی"]]
const CHECKS = [["hours", "ساعات کاری تنظیم شده"], ["tariffs", "تعرفه‌ها تنظیم شده"], ["vets", "دامپزشک اضافه شده"]]

const EditModal = ({ clinic, onClose, onSaved }) => {
  const [f, setF] = useState({ name: clinic.name, phone: clinic.phone, address: clinic.address, region: clinic.region, tdName: clinic.techDirector.name, tdLicense: clinic.techDirector.license, staff: clinic.staff })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const setStaff = (i, k, v) => setF({ ...f, staff: f.staff.map((s, j) => j === i ? { ...s, [k]: v } : s) })
  const submit = async e => {
    e.preventDefault()
    const patch = { name: f.name, phone: f.phone, address: f.address, region: f.region, techDirector: { name: f.tdName, license: f.tdLicense }, staff: f.staff.filter(s => s.name.trim()) }
    if (await run(updateClinic(clinic.id, patch), "اطلاعات کلینیک ذخیره شد", onSaved)) onClose()
  }
  return (
    <Modal isOpen toggle={onClose} size="lg" centered>
      <Form onSubmit={submit}>
        <ModalHeader toggle={onClose}>ویرایش اطلاعات کلینیک</ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}><Label for="e-name">نام</Label><Input id="e-name" required value={f.name} onChange={set("name")} /></Col>
            <Col md={6}><Label for="e-phone">تلفن</Label><Input id="e-phone" dir="ltr" required value={f.phone} onChange={set("phone")} /></Col>
            <Col md={4}><Label for="e-region">منطقه</Label><Input id="e-region" value={f.region} onChange={set("region")} /></Col>
            <Col md={8}><Label for="e-addr">آدرس</Label><Input id="e-addr" value={f.address} onChange={set("address")} /></Col>
            <Col md={6}><Label for="e-td">نام مسئول فنی</Label><Input id="e-td" required value={f.tdName} onChange={set("tdName")} /></Col>
            <Col md={6}><Label for="e-tdl">شماره پروانه مسئول فنی</Label><Input id="e-tdl" required value={f.tdLicense} onChange={set("tdLicense")} /></Col>
            <Col md={12}>
              <Label>کارکنان</Label>
              {f.staff.map((s, i) => (
                <InputGroup key={i} className="mb-2">
                  <Input aria-label="نام" placeholder="نام" value={s.name} onChange={e => setStaff(i, "name", e.target.value)} />
                  <Input aria-label="سمت" placeholder="سمت" value={s.role} onChange={e => setStaff(i, "role", e.target.value)} />
                  <Button color="danger" outline type="button" aria-label="حذف" onClick={() => setF({ ...f, staff: f.staff.filter((_, j) => j !== i) })}><i className="bx bx-trash" /></Button>
                </InputGroup>
              ))}
              <Button size="sm" color="light" type="button" onClick={() => setF({ ...f, staff: [...f.staff, { name: "", role: "" }] })}>+ افزودن کارمند</Button>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={onClose}>انصراف</Button>
          <Button color="primary" type="submit">ذخیره</Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

const ClinicDetail = () => {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") || "info"
  const [c, reload] = useLoad(() => getClinic(id), [id])
  const [editing, setEditing] = useState(false)
  const [rank, setRank] = useState("")
  const [regAction, setRegAction] = useState(null)
  const editable = canEdit("clinics")
  document.title = `${c?.name || "کلینیک"} | های‌پت`
  if (!c) return <div className="page-content"><Loading /></div>

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="کلینیک‌ها" breadcrumbItem={c.name} />
        <Section title={<>{c.name} {c.ambassador && <Badge color="warning" className="ms-2">سفیر {c.ambassador.level}</Badge>}</>} actions={
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Status group="registration" value={c.registration.status} />
            <Status group="active" value={c.active} />
            <Link to={`/clinics/${c.id}/view-as`} className="btn btn-sm btn-outline-dark"><i className="bx bx-show me-1" />مشاهده به‌عنوان کلینیک</Link>
            {editable && <Button size="sm" color="primary" outline onClick={() => setEditing(true)}>ویرایش اطلاعات</Button>}
            {editable && (
              <Button size="sm" color={c.active ? "danger" : "success"} disabled={!c.active && c.registration.status !== "approved"}
                onClick={() => run(setClinicActive(c.id, !c.active), c.active ? "کلینیک غیرفعال شد" : "کلینیک فعال شد", reload)}>
                {c.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
              </Button>
            )}
          </div>
        }>
          <Nav tabs className="nav-tabs-custom">
            {TABS.map(([k, t]) => (
              <NavItem key={k}><NavLink href="#" active={tab === k} onClick={e => { e.preventDefault(); setParams({ tab: k }) }}>{t}</NavLink></NavItem>
            ))}
          </Nav>
        </Section>

        {tab === "info" && (
          <Row>
            <Col lg={7}>
              <Section title="اطلاعات کلینیک">
                <InfoList items={[
                  ["شناسه", faDigits(c.id)], ["تلفن", <span key="p" dir="ltr">{faDigits(c.phone)}</span>], ["شهر / منطقه", `${c.cityName} - ${c.region}`], ["آدرس", c.address],
                  ["مسئول فنی", `${c.techDirector.name} (پروانه ${faDigits(c.techDirector.license)})`],
                  ["کمیسیون های‌پت", `${num(c.commissionRate)}٪`], ["تعداد نوبت‌ها", num(c.appointmentCount)], ["تاریخ عضویت", jdate(c.createdAt)],
                ]} />
              </Section>
            </Col>
            <Col lg={5}>
              <Section title="نمایش در لیست عمومی و سفیری">
                <Label for="rank">رتبه نمایش (عدد کمتر = بالاتر)</Label>
                <InputGroup className="mb-3">
                  <Input id="rank" type="number" min={1} disabled={!editable} placeholder={num(c.rank)} value={rank} onChange={e => setRank(e.target.value)} />
                  {editable && <Button color="primary" disabled={!rank} onClick={async () => { if (await run(setClinicRank(c.id, rank), "رتبه ذخیره شد", reload)) setRank("") }}>ذخیره</Button>}
                </InputGroup>
                <Label for="amb">وضعیت سفیر</Label>
                <Input id="amb" type="select" disabled={!editable} value={c.ambassador?.level || ""}
                  onChange={e => run(setAmbassador(c.id, e.target.value || null), "وضعیت سفیر ذخیره شد", reload)}>
                  <option value="">سفیر نیست</option>
                  {AMBASSADOR_LEVELS.map(l => <option key={l} value={l}>سفیر {l}</option>)}
                </Input>
                {c.referrer && <p className="mt-3 mb-0">معرفی‌شده توسط: <Link to={`/clinics/${c.referrer.id}?tab=referrals`}>{c.referrer.name}</Link></p>}
              </Section>
              <Section title="چک‌لیست راه‌اندازی">
                <ul className="list-unstyled mb-0">
                  {CHECKS.map(([k, t]) => (
                    <li key={k} className="mb-2"><i className={`bx ${c.checklist[k] ? "bx-check-circle text-success" : "bx-x-circle text-danger"} me-2 font-size-16 align-middle`} />{t}</li>
                  ))}
                </ul>
              </Section>
            </Col>
            <Col lg={12}>
              <Section title="آخرین نوبت‌ها" actions={canView("appointments") && <Link to={`/appointments?clinic=${c.id}`} className="btn btn-sm btn-light">همه نوبت‌ها</Link>}>
                <div className="table-responsive">
                  <Table className="table-nowrap mb-0">
                    <thead className="table-light"><tr><th>شناسه</th><th>زمان</th><th>صاحب حیوان</th><th>دامپزشک</th><th>وضعیت</th></tr></thead>
                    <tbody>
                      {c.recentAppointments.map(a => (
                        <tr key={a.id}>
                          <td>{canView("appointments") ? <Link to={`/appointments/${a.id}`}>{faDigits(a.id)}</Link> : faDigits(a.id)}</td>
                          <td>{jdatetime(a.datetime)}</td><td>{a.ownerName}</td><td>{a.vetName}</td><td><Status group="appointment" value={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Section>
            </Col>
          </Row>
        )}

        {tab === "people" && (
          <Row>
            <Col lg={6}>
              <Section title="کارکنان">
                <InfoList items={[["مسئول فنی", c.techDirector.name], ...c.staff.map((s, i) => [s.role || `کارمند ${num(i + 1)}`, s.name])]} />
              </Section>
            </Col>
            <Col lg={6}>
              <Section title="دامپزشکان">
                {c.vets.length ? (
                  <ul className="list-unstyled mb-0">
                    {c.vets.map(v => (
                      <li key={v.id} className="mb-2 d-flex justify-content-between">
                        {canView("vets") ? <Link to={`/vets/${v.id}`}>{v.name}</Link> : v.name}
                        <Badge color={v.bookingEnabled ? "success" : "secondary"}>{v.bookingEnabled ? "نوبت‌دهی فعال" : "نوبت‌دهی غیرفعال"}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted mb-0">دامپزشکی ثبت نشده است.</p>}
              </Section>
            </Col>
          </Row>
        )}

        {tab === "registration" && (
          <Row>
            <Col lg={7}>
              <Section title="مدارک">
                <div className="table-responsive">
                  <Table className="align-middle table-nowrap mb-0">
                    <thead className="table-light"><tr><th>مدرک</th><th>وضعیت</th>{editable && <th>بررسی</th>}</tr></thead>
                    <tbody>
                      {c.registration.documents.map(d => (
                        <tr key={d.id}>
                          <td><i className="bx bx-file me-1" />{d.title}</td>
                          <td><Status group="doc" value={d.status} /></td>
                          {editable && (
                            <td className="d-flex gap-2">
                              <Button size="sm" color="success" outline disabled={d.status === "approved"} onClick={() => run(setClinicDocument(c.id, d.id, "approved"), "مدرک تأیید شد", reload)}>تأیید</Button>
                              <Button size="sm" color="danger" outline disabled={d.status === "rejected"} onClick={() => run(setClinicDocument(c.id, d.id, "rejected"), "مدرک رد شد", reload)}>رد</Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Section>
            </Col>
            <Col lg={5}>
              <Section title="وضعیت ثبت‌نام">
                <InfoList items={[["وضعیت", <Status key="s" group="registration" value={c.registration.status} />], ["تاریخ درخواست", jdate(c.registration.submittedAt)], ["یادداشت", c.registration.note || "—"]]} />
                {editable && (
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    {options("registration").filter(o => o.value !== c.registration.status && o.value !== "submitted").map(o => (
                      <Button key={o.value} size="sm" color={{ approved: "success", rejected: "danger", suspended: "dark", incomplete: "warning" }[o.value]}
                        onClick={() => setRegAction(o)}>{o.text}</Button>
                    ))}
                  </div>
                )}
              </Section>
            </Col>
          </Row>
        )}

        {tab === "referrals" && (
          <Section title={`کلینیک‌های معرفی‌شده توسط ${c.name}`}>
            {c.referrals.length ? (
              <Table className="table-nowrap mb-0">
                <thead className="table-light"><tr><th>کلینیک</th><th>وضعیت ثبت‌نام</th><th>تاریخ عضویت</th></tr></thead>
                <tbody>
                  {c.referrals.map(r => <tr key={r.id}><td><Link to={`/clinics/${r.id}`}>{r.name}</Link></td><td><Status group="registration" value={r.status} /></td><td>{jdate(r.createdAt)}</td></tr>)}
                </tbody>
              </Table>
            ) : <p className="text-muted mb-0">این کلینیک تاکنون کلینیکی معرفی نکرده است.</p>}
          </Section>
        )}

        {tab === "support" && <ContactHistory type="clinic" id={c.id} />}
      </Container>

      {editing && <EditModal clinic={c} onClose={() => setEditing(false)} onSaved={reload} />}
      <ConfirmModal isOpen={!!regAction} title={`تغییر وضعیت ثبت‌نام به «${regAction?.text}»`}
        reasonLabel={regAction && regAction.value !== "approved" ? "یادداشت برای کلینیک" : undefined}
        onClose={() => setRegAction(null)}
        onConfirm={async note => { if (await run(setRegistrationStatus(c.id, regAction.value, note), "وضعیت ثبت‌نام تغییر کرد", reload)) setRegAction(null) }} />
    </div>
  )
}

export default ClinicDetail
