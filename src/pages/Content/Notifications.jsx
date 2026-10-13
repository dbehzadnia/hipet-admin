import React, { useEffect, useMemo, useState } from "react"
import { Badge, Button, Col, Container, Form, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import Select from "react-select"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, InfoList, Loading, Section, SelectFilter, run, useLoad } from "../../components/Common/HiPet"
import { countRecipients, listCities, listNotifications, listTemplates, sendNotification, updateTemplate } from "../../services/content"
import { getLookups } from "../../services/appointments"
import { canEdit } from "../../services/admins"
import { inRange, jdatetime, num } from "../../utils/format"

const AUDIENCES = { all_users: "همه کاربران پت", all_clinics: "همه کلینیک‌ها", all_vets: "همه دامپزشکان", segment: "بخش فیلترشده", single: "یک گیرنده" }
const GROUPS = { owners: "کاربران پت", clinics: "کلینیک‌ها", vets: "دامپزشکان" }
const RECIPIENT = { owner: ["owners", "کاربر پت"], clinic: ["clinics", "کلینیک"], vet: ["vets", "دامپزشک"] }
const CHANNEL = { sms: "پیامک", push: "اعلان پوش" }
const describe = (a, cities) => a.type === "segment" ? `${GROUPS[a.group]}${a.cityId ? ` - ${cities?.find(c => c.id === Number(a.cityId))?.name || ""}` : ""}` : AUDIENCES[a.type]

const SendForm = ({ lookups, templates, cities, onSent }) => {
  const [f, setF] = useState({ channel: "sms", type: "all_users", group: "owners", cityId: "", recipientType: "owner", recipientId: null, templateKey: "", text: "" })
  const [count, setCount] = useState(null)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const audience = useMemo(() => f.type === "segment" ? { type: "segment", group: f.group, cityId: f.cityId ? Number(f.cityId) : undefined }
    : f.type === "single" ? { type: "single", recipientType: f.recipientType, recipientId: f.recipientId } : { type: f.type }, [f])
  useEffect(() => { countRecipients(audience).then(setCount) }, [audience])

  const applyTemplate = key => {
    const t = templates.find(x => x.key === key)
    setF(prev => ({ ...prev, templateKey: key, ...(t && { text: t.text, channel: t.channel }) }))
  }
  const submit = async e => {
    e.preventDefault()
    if (await run(sendNotification({ channel: f.channel, audience, text: f.text, templateKey: f.templateKey || null }), `پیام برای ${num(count)} گیرنده ارسال شد`, onSent))
      setF(prev => ({ ...prev, text: "", templateKey: "" }))
  }
  const people = lookups[RECIPIENT[f.recipientType][0]]

  return (
    <Form onSubmit={submit}>
      <Row className="g-3">
        <Col md={3}>
          <Label for="n-ch">کانال</Label>
          <Input id="n-ch" type="select" value={f.channel} onChange={e => set("channel", e.target.value)}>
            {Object.entries(CHANNEL).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </Input>
        </Col>
        <Col md={3}>
          <Label for="n-aud">گیرندگان</Label>
          <Input id="n-aud" type="select" value={f.type} onChange={e => set("type", e.target.value)}>
            {Object.entries(AUDIENCES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </Input>
        </Col>
        {f.type === "segment" && <>
          <Col md={3}>
            <Label for="n-grp">گروه</Label>
            <Input id="n-grp" type="select" value={f.group} onChange={e => set("group", e.target.value)}>
              {Object.entries(GROUPS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </Input>
          </Col>
          <Col md={3}>
            <Label for="n-city">شهر</Label>
            <Input id="n-city" type="select" value={f.cityId} onChange={e => set("cityId", e.target.value)}>
              <option value="">همه شهرها</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Input>
          </Col>
        </>}
        {f.type === "single" && <>
          <Col md={3}>
            <Label for="n-rt">نوع گیرنده</Label>
            <Input id="n-rt" type="select" value={f.recipientType} onChange={e => { set("recipientType", e.target.value); set("recipientId", null) }}>
              {Object.entries(RECIPIENT).map(([k, [, t]]) => <option key={k} value={k}>{t}</option>)}
            </Input>
          </Col>
          <Col md={3}>
            <Label>گیرنده</Label>
            <Select key={f.recipientType} placeholder="جستجو..." aria-label="گیرنده"
              options={people.map(p => ({ value: p.id, label: p.phone ? `${p.name} - ${p.phone}` : p.name }))}
              onChange={o => set("recipientId", o.value)} />
          </Col>
        </>}
        <Col md={6}>
          <Label for="n-tpl">قالب پیام</Label>
          <Input id="n-tpl" type="select" value={f.templateKey} onChange={e => applyTemplate(e.target.value)}>
            <option value="">بدون قالب (متن آزاد)</option>
            {templates.map(t => <option key={t.key} value={t.key}>{t.title}</option>)}
          </Input>
        </Col>
        <Col md={12}>
          <Label for="n-text">متن پیام</Label>
          <Input id="n-text" type="textarea" rows={3} required value={f.text} onChange={e => set("text", e.target.value)} />
          <small className="text-muted">متغیرهای قالب مثل {"{name}"} و {"{pet}"} هنگام ارسال توسط سرور جایگزین می‌شوند.</small>
        </Col>
        <Col md={12} className="d-flex align-items-center justify-content-between">
          <span>تعداد گیرندگان: <Badge color="primary" className="font-size-13">{count === null ? "…" : num(count)}</Badge></span>
          <Button color="primary" type="submit" disabled={!f.text.trim() || !count}><i className="bx bx-send me-1" />ارسال</Button>
        </Col>
      </Row>
    </Form>
  )
}

const Notifications = () => {
  document.title = "اعلان‌ها | های‌پت"
  const [list, reload] = useLoad(listNotifications)
  const [templates, reloadT] = useLoad(listTemplates)
  const [lookups] = useLoad(getLookups)
  const [cities] = useLoad(listCities)
  const [channel, setChannel] = useState("")
  const [range, setRange] = useState([null, null])
  const [view, setView] = useState(null)
  const [tpl, setTpl] = useState(null)
  const editable = canEdit("content")

  const rows = useMemo(() => (list || []).filter(n => (!channel || n.channel === channel) && inRange(n.sentAt, range)), [list, channel, range])
  const columns = useMemo(() => [
    { header: "زمان ارسال", accessorKey: "sentAt", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "کانال", accessorKey: "channel", cell: c => CHANNEL[c.getValue()] },
    { header: "گیرندگان", accessorFn: n => describe(n.audience, cities), id: "aud" },
    { header: "تعداد", accessorKey: "recipients", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "متن", accessorKey: "text", cell: c => <span className="d-inline-block text-truncate" style={{ maxWidth: 260 }}>{c.getValue()}</span> },
    { header: "ارسال‌کننده", accessorKey: "adminName" },
    { header: "", id: "act", enableSorting: false, cell: ({ row }) => <Button size="sm" color="light" onClick={() => setView(row.original)}>جزئیات</Button> },
  ], [cities])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="محتوا و تنظیمات" breadcrumbItem="اعلان‌ها" />
        {editable && (
          <Section title="ارسال پیامک / اعلان">
            {templates && lookups && cities ? <SendForm lookups={lookups} templates={templates} cities={cities} onSent={reload} /> : <Loading />}
          </Section>
        )}
        <Section title="قالب‌های پیام">
          {templates ? (
            <Row>
              {templates.map(t => (
                <Col md={4} key={t.id}>
                  <div className="border rounded p-3 mb-3 h-100">
                    <div className="d-flex justify-content-between mb-2"><strong>{t.title}</strong><Badge color="info">{CHANNEL[t.channel]}</Badge></div>
                    <p className="text-muted mb-2">{t.text}</p>
                    {editable && <Button size="sm" color="light" onClick={() => setTpl({ ...t })}>ویرایش قالب</Button>}
                  </div>
                </Col>
              ))}
            </Row>
          ) : <Loading />}
        </Section>
        <Section title="تاریخچه ارسال‌ها">
          <FilterBar>
            <SelectFilter value={channel} onChange={setChannel} placeholder="همه کانال‌ها" options={Object.entries(CHANNEL).map(([value, text]) => ({ value, text }))} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجو در متن پیام..." /> : <Loading />}
        </Section>
      </Container>

      <Modal isOpen={!!view} toggle={() => setView(null)} centered>
        <ModalHeader toggle={() => setView(null)}>جزئیات ارسال</ModalHeader>
        <ModalBody>
          {view && <InfoList items={[["زمان", jdatetime(view.sentAt)], ["کانال", CHANNEL[view.channel]], ["گیرندگان", describe(view.audience, cities)], ["تعداد", num(view.recipients)], ["قالب", templates?.find(t => t.key === view.templateKey)?.title || "—"], ["ارسال‌کننده", view.adminName], ["متن", view.text]]} />}
        </ModalBody>
      </Modal>

      <Modal isOpen={!!tpl} toggle={() => setTpl(null)} centered>
        {tpl && (
          <Form onSubmit={async e => { e.preventDefault(); if (await run(updateTemplate(tpl.id, { title: tpl.title, channel: tpl.channel, text: tpl.text }), "قالب ذخیره شد", reloadT)) setTpl(null) }}>
            <ModalHeader toggle={() => setTpl(null)}>ویرایش قالب «{tpl.title}»</ModalHeader>
            <ModalBody>
              <Label for="t-title">عنوان</Label>
              <Input id="t-title" required className="mb-3" value={tpl.title} onChange={e => setTpl({ ...tpl, title: e.target.value })} />
              <Label for="t-ch">کانال پیش‌فرض</Label>
              <Input id="t-ch" type="select" className="mb-3" value={tpl.channel} onChange={e => setTpl({ ...tpl, channel: e.target.value })}>
                {Object.entries(CHANNEL).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
              </Input>
              <Label for="t-text">متن</Label>
              <Input id="t-text" type="textarea" rows={4} required value={tpl.text} onChange={e => setTpl({ ...tpl, text: e.target.value })} />
            </ModalBody>
            <ModalFooter>
              <Button color="light" type="button" onClick={() => setTpl(null)}>انصراف</Button>
              <Button color="primary" type="submit">ذخیره</Button>
            </ModalFooter>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default Notifications
