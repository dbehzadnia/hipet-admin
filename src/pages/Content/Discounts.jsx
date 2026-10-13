import React, { useMemo, useState } from "react"
import { Button, Col, Container, Form, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Progress, Row } from "reactstrap"
import Select from "react-select"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateInput, FilterBar, Loading, Section, SelectFilter, Status, run, useLoad } from "../../components/Common/HiPet"
import { listDiscounts, saveDiscount, setDiscountActive } from "../../services/content"
import { getLookups } from "../../services/appointments"
import { canEdit } from "../../services/admins"
import { jdate, num, toman } from "../../utils/format"

const SCOPES = { all: "همه کلینیک‌ها و خدمات", clinics: "کلینیک‌های خاص", services: "خدمات خاص" }
const valueText = d => d.type === "percent" ? `${num(d.value)}٪` : toman(d.value)
const state = d => !d.active ? "inactive" : new Date(d.to) < new Date() ? "expired" : d.usageLimit && d.used >= d.usageLimit ? "used_up" : new Date(d.from) > new Date() ? "scheduled" : "running"
const STATE = { running: ["در حال اجرا", "success"], scheduled: ["زمان‌بندی‌شده", "info"], expired: ["منقضی", "secondary"], used_up: ["سقف استفاده پر شد", "warning"], inactive: ["غیرفعال", "dark"] }

const Discounts = () => {
  document.title = "کدهای تخفیف | های‌پت"
  const [list, reload] = useLoad(listDiscounts)
  const [lookups] = useLoad(getLookups)
  const [st, setSt] = useState("")
  const [form, setForm] = useState(null)
  const editable = canEdit("content")

  const rows = useMemo(() => (list || []).filter(d => !st || state(d) === st), [list, st])
  const scopeText = d => d.scope.type === "all" ? SCOPES.all : d.scope.ids.map(id => (d.scope.type === "clinics" ? lookups?.clinics : lookups?.services)?.find(x => x.id === id)?.name).filter(Boolean).join("، ")

  const columns = useMemo(() => [
    { header: "کد", accessorKey: "code", enableSorting: true, cell: c => <code dir="ltr">{c.getValue()}</code> },
    { header: "مقدار", accessorKey: "value", enableSorting: true, cell: ({ row }) => valueText(row.original) },
    { header: "اعتبار", accessorKey: "to", enableSorting: true, cell: ({ row: { original: d } }) => `${jdate(d.from)} تا ${jdate(d.to)}` },
    { header: "دامنه", accessorFn: d => SCOPES[d.scope.type], id: "scope" },
    {
      header: "استفاده", accessorKey: "used", enableSorting: true, cell: ({ row: { original: d } }) => (
        <div style={{ minWidth: 120 }}>
          <small>{num(d.used)} از {d.usageLimit ? num(d.usageLimit) : "نامحدود"}</small>
          {d.usageLimit > 0 && <Progress value={(d.used / d.usageLimit) * 100} className="progress-sm mt-1" />}
        </div>
      ),
    },
    { header: "وضعیت", accessorFn: state, id: "state", cell: c => <span className={`badge badge-soft-${STATE[c.getValue()][1]}`}>{STATE[c.getValue()][0]}</span> },
    {
      header: "", id: "act", enableSorting: false, cell: ({ row: { original: d } }) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setForm({ ...structuredClone(d), from: new Date(d.from), to: new Date(d.to) })}>{editable ? "ویرایش" : "جزئیات"}</Button>
          {editable && <Button size="sm" color={d.active ? "danger" : "success"} outline onClick={() => run(setDiscountActive(d.id, !d.active), d.active ? "کد غیرفعال شد" : "کد فعال شد", reload)}>{d.active ? "غیرفعال" : "فعال"}</Button>}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [editable])

  const submit = async e => {
    e.preventDefault()
    if (await run(saveDiscount(form), "کد تخفیف ذخیره شد", reload)) setForm(null)
  }
  const scopeOptions = form && ((form.scope.type === "clinics" ? lookups?.clinics : lookups?.services) || []).map(x => ({ value: x.id, label: x.name }))

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="محتوا و تنظیمات" breadcrumbItem="کدهای تخفیف" />
        <Section title="کدهای تخفیف" actions={editable && lookups && <Button color="success" onClick={() => setForm({ code: "", type: "percent", value: "", from: new Date(), to: null, usageLimit: "", scope: { type: "all", ids: [] }, active: true })}><i className="mdi mdi-plus me-1" />کد جدید</Button>}>
          <FilterBar>
            <SelectFilter value={st} onChange={setSt} placeholder="همه وضعیت‌ها" options={Object.entries(STATE).map(([value, [text]]) => ({ value, text }))} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی کد..." /> : <Loading />}
        </Section>
      </Container>
      <Modal isOpen={!!form} toggle={() => setForm(null)} centered size="lg">
        {form && (
          <Form onSubmit={submit}>
            <ModalHeader toggle={() => setForm(null)}>{form.id ? `کد ${form.code}` : "کد تخفیف جدید"}</ModalHeader>
            <ModalBody>
              {form.id && <p className="text-muted">آمار استفاده: {num(form.used)} بار از سقف {form.usageLimit ? num(form.usageLimit) : "نامحدود"} — دامنه: {scopeText(form) || "—"}</p>}
              <fieldset disabled={!editable}>
                <Row className="g-3">
                  <Col md={4}><Label for="d-code">کد</Label><Input id="d-code" dir="ltr" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Col>
                  <Col md={4}>
                    <Label for="d-type">نوع</Label>
                    <Input id="d-type" type="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="percent">درصدی</option><option value="fixed">مبلغ ثابت (تومان)</option>
                    </Input>
                  </Col>
                  <Col md={4}><Label for="d-val">{form.type === "percent" ? "درصد" : "مبلغ (تومان)"}</Label><Input id="d-val" type="number" min={1} max={form.type === "percent" ? 100 : undefined} required value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></Col>
                  <Col md={4}><Label>از تاریخ</Label><DateInput value={form.from} onChange={v => setForm({ ...form, from: v })} /></Col>
                  <Col md={4}><Label>تا تاریخ</Label><DateInput value={form.to} onChange={v => setForm({ ...form, to: v })} /></Col>
                  <Col md={4}><Label for="d-limit">سقف استفاده (خالی = نامحدود)</Label><Input id="d-limit" type="number" min={0} value={form.usageLimit || ""} onChange={e => setForm({ ...form, usageLimit: e.target.value })} /></Col>
                  <Col md={4}>
                    <Label for="d-scope">دامنه</Label>
                    <Input id="d-scope" type="select" value={form.scope.type} onChange={e => setForm({ ...form, scope: { type: e.target.value, ids: [] } })}>
                      {Object.entries(SCOPES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                    </Input>
                  </Col>
                  {form.scope.type !== "all" && (
                    <Col md={8}>
                      <Label>{form.scope.type === "clinics" ? "کلینیک‌ها" : "خدمات"}</Label>
                      <Select isMulti placeholder="انتخاب کنید..." aria-label="دامنه" isDisabled={!editable} options={scopeOptions}
                        value={scopeOptions.filter(o => form.scope.ids.includes(o.value))}
                        onChange={v => setForm({ ...form, scope: { ...form.scope, ids: v.map(o => o.value) } })} />
                    </Col>
                  )}
                </Row>
              </fieldset>
            </ModalBody>
            <ModalFooter>
              <Button color="light" type="button" onClick={() => setForm(null)}>بستن</Button>
              {editable && <Button color="primary" type="submit">ذخیره</Button>}
            </ModalFooter>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default Discounts
