import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Badge, Button, Col, Container, Form, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import Select from "react-select"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateInput, DateRange, FilterBar, Loading, Section, SelectFilter, Status, run, useLoad } from "../../components/Common/HiPet"
import { createAppointment, getLookups, listAppointments } from "../../services/appointments"
import { canEdit } from "../../services/admins"
import { faDigits, inRange, jdatetime, options } from "../../utils/format"

const CreateModal = ({ lookups, onClose, onDone }) => {
  const [f, setF] = useState({ ownerId: null, petId: "", clinicId: null, vetId: "", serviceId: "", datetime: null, price: "", deposit: "", emergency: false })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  const pets = lookups.pets.filter(p => p.ownerId === f.ownerId)
  const vets = lookups.vets.filter(v => v.clinicIds.includes(f.clinicId))
  const submit = async e => {
    e.preventDefault()
    if (await run(createAppointment(f), "نوبت ایجاد شد", onDone)) onClose()
  }
  const valid = f.ownerId && f.petId && f.clinicId && f.vetId && f.serviceId && f.datetime
  return (
    <Modal isOpen toggle={onClose} size="lg" centered>
      <Form onSubmit={submit}>
        <ModalHeader toggle={onClose}>ایجاد دستی نوبت</ModalHeader>
        <ModalBody>
          <Row className="g-3">
            <Col md={6}>
              <Label>صاحب حیوان *</Label>
              <Select placeholder="جستجوی نام یا موبایل..." aria-label="صاحب حیوان"
                options={lookups.owners.map(o => ({ value: o.id, label: `${o.name} - ${o.phone}` }))}
                onChange={o => { set("ownerId", o.value); set("petId", "") }} />
            </Col>
            <Col md={6}>
              <Label for="c-pet">حیوان *</Label>
              <Input id="c-pet" type="select" value={f.petId} onChange={e => set("petId", Number(e.target.value))} disabled={!f.ownerId}>
                <option value="">انتخاب کنید</option>
                {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
              </Input>
            </Col>
            <Col md={6}>
              <Label>کلینیک *</Label>
              <Select placeholder="جستجوی کلینیک..." aria-label="کلینیک"
                options={lookups.clinics.filter(c => c.active).map(c => ({ value: c.id, label: c.name }))}
                onChange={o => { set("clinicId", o.value); set("vetId", "") }} />
            </Col>
            <Col md={6}>
              <Label for="c-vet">دامپزشک *</Label>
              <Input id="c-vet" type="select" value={f.vetId} onChange={e => set("vetId", Number(e.target.value))} disabled={!f.clinicId}>
                <option value="">انتخاب کنید</option>
                {vets.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </Input>
            </Col>
            <Col md={6}>
              <Label for="c-svc">خدمت *</Label>
              <Input id="c-svc" type="select" value={f.serviceId} onChange={e => set("serviceId", Number(e.target.value))}>
                <option value="">انتخاب کنید</option>
                {lookups.services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Input>
            </Col>
            <Col md={6}><Label>تاریخ و ساعت *</Label><DateInput withTime value={f.datetime} onChange={v => set("datetime", v)} /></Col>
            <Col md={4}><Label for="c-price">مبلغ کل (تومان)</Label><Input id="c-price" type="number" min={0} value={f.price} onChange={e => set("price", e.target.value)} /></Col>
            <Col md={4}><Label for="c-dep">بیعانه (تومان)</Label><Input id="c-dep" type="number" min={0} value={f.deposit} onChange={e => set("deposit", e.target.value)} /></Col>
            <Col md={4} className="d-flex align-items-end">
              <div className="form-check mb-2">
                <Input id="c-em" type="checkbox" className="form-check-input" checked={f.emergency} onChange={e => set("emergency", e.target.checked)} />
                <Label for="c-em" className="form-check-label">نوبت اورژانسی</Label>
              </div>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={onClose}>انصراف</Button>
          <Button color="primary" type="submit" disabled={!valid}>ثبت نوبت</Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

const AppointmentsList = () => {
  document.title = "نوبت‌ها | های‌پت"
  const [params] = useSearchParams()
  const [list, reload] = useLoad(listAppointments)
  const [lookups] = useLoad(getLookups)
  const [clinic, setClinic] = useState(params.get("clinic") || "")
  const [vet, setVet] = useState(params.get("vet") || "")
  const [status, setStatus] = useState(params.get("status") || "")
  const [payment, setPayment] = useState("")
  const [range, setRange] = useState([null, null])
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => (list || []).filter(a =>
    (!clinic || a.clinicId === Number(clinic)) && (!vet || a.vetId === Number(vet)) &&
    (!status || a.status === status) && (!payment || a.paymentStatus === payment) && inRange(a.datetime, range)),
  [list, clinic, vet, status, payment, range])

  const columns = useMemo(() => [
    {
      header: "شناسه", accessorKey: "id", enableSorting: true, cell: ({ row: { original: a } }) => (
        <Link to={`/appointments/${a.id}`} className="fw-bold">
          {faDigits(a.id)} {a.emergency && <Badge color="danger" className="ms-1">اورژانسی</Badge>}
        </Link>
      ),
    },
    { header: "صاحب حیوان", accessorKey: "ownerName", enableSorting: true },
    { header: "حیوان", accessorKey: "petName" },
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true },
    { header: "دامپزشک", accessorKey: "vetName", enableSorting: true },
    { header: "خدمت", accessorKey: "serviceName" },
    { header: "زمان", accessorKey: "datetime", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="appointment" value={c.getValue()} /> },
    { header: "پرداخت", accessorKey: "paymentStatus", cell: c => <Status group="payment" value={c.getValue()} /> },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/appointments/${row.original.id}`} className="btn btn-sm btn-light">جزئیات</Link> },
  ], [])

  const vetOptions = (lookups?.vets || []).filter(v => !clinic || v.clinicIds.includes(Number(clinic)))

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="نوبت‌ها" />
        <Section title="همه نوبت‌ها" actions={canEdit("appointments") && lookups &&
          <Button color="success" onClick={() => setCreating(true)}><i className="mdi mdi-plus me-1" />ایجاد دستی نوبت</Button>}>
          <FilterBar>
            <SelectFilter value={clinic} onChange={v => { setClinic(v); setVet("") }} placeholder="همه کلینیک‌ها" options={(lookups?.clinics || []).map(c => ({ value: c.id, text: c.name }))} />
            <SelectFilter value={vet} onChange={setVet} placeholder="همه دامپزشکان" options={vetOptions.map(v => ({ value: v.id, text: v.name }))} />
            <SelectFilter value={status} onChange={setStatus} placeholder="همه وضعیت‌ها" options={options("appointment")} />
            <SelectFilter value={payment} onChange={setPayment} placeholder="همه وضعیت‌های پرداخت" options={options("payment")} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} rowClassName={a => a.emergency ? "table-danger" : undefined}
            SearchPlaceholder="جستجو: شناسه، نام، کلینیک..." /> : <Loading />}
        </Section>
      </Container>
      {creating && <CreateModal lookups={lookups} onClose={() => setCreating(false)} onDone={reload} />}
    </div>
  )
}

export default AppointmentsList
