import React, { useMemo, useState } from "react"
import { Button, Col, Container, Form, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, FilterBar, Loading, Section, SelectFilter, Status, run, useLoad } from "../../components/Common/HiPet"
import { SERVICE_TYPES, listServices, moveService, saveService } from "../../services/content"
import { canEdit } from "../../services/admins"

const Services = () => {
  document.title = "خدمات | های‌پت"
  const [list, reload] = useLoad(listServices)
  const [type, setType] = useState("")
  const [parent, setParent] = useState("")
  const [form, setForm] = useState(null)
  const editable = canEdit("content")

  const roots = useMemo(() => (list || []).filter(s => !s.parentId), [list])
  const nameOf = id => list?.find(s => s.id === id)?.name
  // Tree order: each category followed by its sub-services.
  const rows = useMemo(() => roots.flatMap(r => [r, ...(list || []).filter(s => s.parentId === r.id)])
    .filter(s => (!type || s.type === type) && (!parent || s.id === Number(parent) || s.parentId === Number(parent))), [list, roots, type, parent])

  const columns = useMemo(() => [
    { header: "نام", accessorKey: "name", cell: ({ row: { original: s } }) => s.parentId ? <span className="ps-4">↳ {s.name}</span> : <strong>{s.name}</strong> },
    { header: "دسته اصلی", accessorFn: s => nameOf(s.parentId) || "—", id: "parent" },
    { header: "نوع کسب‌وکار", accessorFn: s => SERVICE_TYPES[s.type], id: "type" },
    { header: "وضعیت", accessorKey: "active", cell: c => <Status group="active" value={c.getValue()} /> },
    {
      header: "عملیات", id: "act", enableSorting: false, cell: ({ row: { original: s } }) => (
        <div className="d-flex gap-1">
          <Button size="sm" color="light" onClick={() => setForm({ ...s })}>{editable ? "ویرایش" : "جزئیات"}</Button>
          {editable && <>
            <Button size="sm" color="light" aria-label="انتقال به بالا" onClick={() => run(moveService(s.id, "up"), "ترتیب تغییر کرد", reload)}><i className="bx bx-up-arrow-alt" /></Button>
            <Button size="sm" color="light" aria-label="انتقال به پایین" onClick={() => run(moveService(s.id, "down"), "ترتیب تغییر کرد", reload)}><i className="bx bx-down-arrow-alt" /></Button>
          </>}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [list, editable])

  const submit = async e => {
    e.preventDefault()
    if (await run(saveService(form), "خدمت ذخیره شد", reload)) setForm(null)
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="محتوا و تنظیمات" breadcrumbItem="خدمات" />
        <Section title="دسته‌بندی خدمات و زیرخدمات" actions={editable && <Button color="success" onClick={() => setForm({ name: "", parentId: "", type: "veterinary", active: true })}><i className="mdi mdi-plus me-1" />خدمت جدید</Button>}>
          <FilterBar>
            <SelectFilter value={type} onChange={setType} placeholder="همه انواع کسب‌وکار" options={Object.entries(SERVICE_TYPES).map(([value, text]) => ({ value, text }))} />
            <SelectFilter value={parent} onChange={setParent} placeholder="همه دسته‌ها" options={roots.map(r => ({ value: r.id, text: r.name }))} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی خدمت..." /> : <Loading />}
        </Section>
      </Container>
      <Modal isOpen={!!form} toggle={() => setForm(null)} centered>
        {form && (
          <Form onSubmit={submit}>
            <ModalHeader toggle={() => setForm(null)}>{form.id ? "ویرایش خدمت" : "خدمت جدید"}</ModalHeader>
            <ModalBody>
              <fieldset disabled={!editable}>
                <Row className="g-3">
                  <Col sm={12}><Label for="s-name">نام</Label><Input id="s-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Col>
                  <Col sm={6}>
                    <Label for="s-parent">دسته اصلی</Label>
                    <Input id="s-parent" type="select" value={form.parentId || ""} onChange={e => setForm({ ...form, parentId: e.target.value })}>
                      <option value="">— (خودش دسته اصلی است)</option>
                      {roots.filter(r => r.id !== form.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Input>
                  </Col>
                  <Col sm={6}>
                    <Label for="s-type">نوع کسب‌وکار</Label>
                    <Input id="s-type" type="select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {Object.entries(SERVICE_TYPES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                    </Input>
                  </Col>
                  <Col sm={12}>
                    <div className="form-check form-switch">
                      <Input id="s-active" type="checkbox" className="form-check-input" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                      <Label for="s-active" className="form-check-label">فعال</Label>
                    </div>
                  </Col>
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

export default Services
