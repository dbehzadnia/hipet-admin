import React, { useMemo, useState } from "react"
import { Button, Container, Form, Input, InputGroup, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, Loading, Section, run, useLoad } from "../../components/Common/HiPet"
import { listCities, saveCity } from "../../services/content"
import { canEdit } from "../../services/admins"
import { num } from "../../utils/format"

const Cities = () => {
  document.title = "شهرها و مناطق | های‌پت"
  const [list, reload] = useLoad(listCities)
  const [form, setForm] = useState(null)
  const editable = canEdit("content")

  const columns = useMemo(() => [
    { header: "شهر", accessorKey: "name", enableSorting: true },
    { header: "تعداد مناطق", accessorFn: c => c.regions.length, id: "count", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "مناطق", accessorFn: c => c.regions.map(r => r.name).join("، "), id: "regions", cell: c => <span style={{ whiteSpace: "normal" }}>{c.getValue()}</span> },
    { header: "", id: "act", enableSorting: false, cell: ({ row }) => <Button size="sm" color="light" onClick={() => setForm(structuredClone(row.original))}>{editable ? "ویرایش" : "جزئیات"}</Button> },
  ], [editable])

  const setRegion = (i, name) => setForm({ ...form, regions: form.regions.map((r, j) => j === i ? { ...r, name } : r) })
  const submit = async e => {
    e.preventDefault()
    if (await run(saveCity(form), "شهر ذخیره شد", reload)) setForm(null)
  }

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="محتوا و تنظیمات" breadcrumbItem="شهرها و مناطق" />
        <Section title="شهرها و مناطق" actions={editable && <Button color="success" onClick={() => setForm({ name: "", regions: [{ name: "" }] })}><i className="mdi mdi-plus me-1" />شهر جدید</Button>}>
          {list ? <DataTable columns={columns} data={list} SearchPlaceholder="جستجوی شهر یا منطقه..." /> : <Loading />}
        </Section>
      </Container>
      <Modal isOpen={!!form} toggle={() => setForm(null)} centered>
        {form && (
          <Form onSubmit={submit}>
            <ModalHeader toggle={() => setForm(null)}>{form.id ? `ویرایش ${form.name}` : "شهر جدید"}</ModalHeader>
            <ModalBody>
              <fieldset disabled={!editable}>
                <Label for="c-name">نام شهر</Label>
                <Input id="c-name" required className="mb-3" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Label>مناطق</Label>
                {form.regions.map((r, i) => (
                  <InputGroup key={i} className="mb-2">
                    <Input aria-label={`منطقه ${i + 1}`} value={r.name} onChange={e => setRegion(i, e.target.value)} />
                    <Button color="danger" outline type="button" aria-label="حذف منطقه" onClick={() => setForm({ ...form, regions: form.regions.filter((_, j) => j !== i) })}><i className="bx bx-trash" /></Button>
                  </InputGroup>
                ))}
                <Button size="sm" color="light" type="button" onClick={() => setForm({ ...form, regions: [...form.regions, { name: "" }] })}>+ افزودن منطقه</Button>
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

export default Cities
