import React, { useMemo, useState } from "react"
import { Button, Col, Container, Form, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, FilterBar, InfoList, Loading, Section, SelectFilter, Status, run, useLoad } from "../../components/Common/HiPet"
import { canEdit, createAdmin, listAdmins, listRoles, setAdminActive, updateAdmin } from "../../services/admins"

const EMPTY = { name: "", email: "", password: "", role: "support" }

const AdminsList = () => {
  document.title = "ادمین‌ها | های‌پت"
  const [admins, reload] = useLoad(listAdmins)
  const [roles] = useLoad(listRoles)
  const [role, setRole] = useState("")
  const [active, setActive] = useState("")
  const [form, setForm] = useState(null) // null = closed, {id?} = editing
  const [view, setView] = useState(null)
  const editable = canEdit("admins")
  const roleName = key => roles?.find(r => r.key === key)?.name || key

  const rows = useMemo(() => (admins || []).filter(a =>
    (!role || a.role === role) && (active === "" || String(a.active) === active)), [admins, role, active])

  const columns = useMemo(() => [
    { header: "نام", accessorKey: "name", enableSorting: true },
    { header: "ایمیل", accessorKey: "email", enableSorting: true },
    { header: "نقش", accessorFn: r => roleName(r.role), id: "role", enableSorting: true },
    { header: "وضعیت", accessorKey: "active", cell: c => <Status group="active" value={c.getValue()} /> },
    {
      header: "عملیات", id: "actions", enableSorting: false, cell: ({ row: { original: a } }) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setView(a)}>جزئیات</Button>
          {editable && <Button size="sm" color="primary" outline onClick={() => setForm({ ...a, password: "" })}>ویرایش</Button>}
          {editable && (
            <Button size="sm" color={a.active ? "danger" : "success"} outline
              onClick={() => run(setAdminActive(a.id, !a.active), a.active ? "ادمین غیرفعال شد" : "ادمین فعال شد", reload)}>
              {a.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
            </Button>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [roles, editable])

  const submit = async e => {
    e.preventDefault()
    const { id, name, email, password, role } = form
    const done = await run(id ? updateAdmin(id, { name, email, password, role }) : createAdmin({ name, email, password, role }),
      id ? "ادمین ویرایش شد" : "ادمین ایجاد شد", reload)
    if (done) setForm(null)
  }
  const set = k => e => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="مدیریت ادمین‌ها" breadcrumbItem="ادمین‌ها" />
        <Section title="لیست ادمین‌ها" actions={editable && <Button color="success" onClick={() => setForm(EMPTY)}><i className="mdi mdi-plus me-1" />ادمین جدید</Button>}>
          <FilterBar>
            <SelectFilter value={role} onChange={setRole} placeholder="همه نقش‌ها" options={(roles || []).map(r => ({ value: r.key, text: r.name }))} />
            <SelectFilter value={active} onChange={setActive} placeholder="همه وضعیت‌ها" options={[{ value: "true", text: "فعال" }, { value: "false", text: "غیرفعال" }]} />
          </FilterBar>
          {admins ? (
            <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی نام یا ایمیل..." />
          ) : <Loading />}
        </Section>
      </Container>

      <Modal isOpen={!!form} toggle={() => setForm(null)} centered>
        {form && (
          <Form onSubmit={submit}>
            <ModalHeader toggle={() => setForm(null)}>{form.id ? "ویرایش ادمین" : "ادمین جدید"}</ModalHeader>
            <ModalBody>
              <Row className="g-3">
                <Col sm={12}><Label for="a-name">نام</Label><Input id="a-name" required value={form.name} onChange={set("name")} /></Col>
                <Col sm={12}><Label for="a-email">ایمیل</Label><Input id="a-email" type="email" dir="ltr" required value={form.email} onChange={set("email")} /></Col>
                <Col sm={12}>
                  <Label for="a-pass">رمز عبور {form.id && <small className="text-muted">(برای عدم تغییر خالی بگذارید)</small>}</Label>
                  <Input id="a-pass" type="password" dir="ltr" required={!form.id} minLength={6} value={form.password} onChange={set("password")} />
                </Col>
                <Col sm={12}>
                  <Label for="a-role">نقش</Label>
                  <Input id="a-role" type="select" value={form.role} onChange={set("role")}>
                    {(roles || []).map(r => <option key={r.key} value={r.key}>{r.name}</option>)}
                  </Input>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="light" type="button" onClick={() => setForm(null)}>انصراف</Button>
              <Button color="primary" type="submit">ذخیره</Button>
            </ModalFooter>
          </Form>
        )}
      </Modal>

      <Modal isOpen={!!view} toggle={() => setView(null)} centered>
        <ModalHeader toggle={() => setView(null)}>جزئیات ادمین</ModalHeader>
        <ModalBody>
          {view && <InfoList items={[["نام", view.name], ["ایمیل", view.email], ["نقش", roleName(view.role)], ["وضعیت", <Status key="s" group="active" value={view.active} />]]} />}
        </ModalBody>
      </Modal>
    </div>
  )
}

export default AdminsList
