// Small shared building blocks for HiPet pages, styled with the template's Bootstrap classes.
import React, { useCallback, useEffect, useState } from "react"
import { Badge, Button, Card, CardBody, Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "reactstrap"
import DatePicker from "react-multi-date-picker"
import TimePicker from "react-multi-date-picker/plugins/time_picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { utils, writeFile } from "xlsx"
import { toast } from "react-toastify"
import { LABELS } from "../../utils/format"
import TableContainer from "./TableContainer"

export const Status = ({ group, value }) => {
  const [text, color] = LABELS[group][value] || [String(value), "secondary"]
  return <Badge color={color} className={`badge-soft-${color} font-size-12`}>{text}</Badge>
}

// Loads data from a service function and exposes a reload callback.
export const useLoad = (fn, deps = []) => {
  const [data, setData] = useState(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => fn().then(setData).catch(e => toast.error(e.message)), deps)
  useEffect(() => { load() }, [load])
  return [data, load]
}

// Runs a mutating service call, shows the result as a toast, then reloads.
export const run = async (promise, success, reload) => {
  try {
    await promise
    toast.success(success)
    reload && reload()
    return true
  } catch (e) {
    toast.error(e.message)
    return false
  }
}

export const Loading = () => <div className="text-center my-5"><i className="bx bx-loader bx-spin font-size-24 text-primary" /></div>

export const SelectFilter = ({ value, onChange, options, placeholder }) => (
  <Input type="select" value={value} onChange={e => onChange(e.target.value)} aria-label={placeholder}>
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
  </Input>
)

/** Jalali date range picker. value/onChange use [Date|null, Date|null]. */
export const DateRange = ({ value, onChange, placeholder = "بازه تاریخ" }) => (
  <DatePicker
    range
    calendar={persian}
    locale={persian_fa}
    calendarPosition="bottom-right"
    value={value.filter(Boolean)}
    onChange={d => onChange([d?.[0]?.toDate() || null, d?.[1]?.toDate() || null])}
    inputClass="form-control"
    containerClassName="w-100"
    placeholder={placeholder}
  />
)

/** Jalali date (optionally with time) picker. value/onChange use Date|null. */
export const DateInput = ({ value, onChange, withTime, placeholder }) => (
  <DatePicker
    calendar={persian}
    locale={persian_fa}
    calendarPosition="bottom-right"
    value={value || ""}
    onChange={d => onChange(d ? d.toDate() : null)}
    format={withTime ? "YYYY/MM/DD HH:mm" : "YYYY/MM/DD"}
    plugins={withTime ? [<TimePicker key="t" position="bottom" hideSeconds />] : []}
    inputClass="form-control"
    containerClassName="w-100"
    placeholder={placeholder}
  />
)

export const FilterBar = ({ children }) => (
  <Row className="g-2 mb-3">
    {React.Children.toArray(children).filter(Boolean).map((c, i) => <Col key={i} sm={6} md={4} lg={3}>{c}</Col>)}
  </Row>
)

export const exportExcel = (rows, filename) => {
  const ws = utils.json_to_sheet(rows)
  ws["!views"] = [{ RTL: true }]
  const wb = utils.book_new()
  wb.Workbook = { Views: [{ RTL: true }] }
  utils.book_append_sheet(wb, ws, "گزارش")
  writeFile(wb, `${filename}.xlsx`)
}

export const InfoList = ({ items }) => (
  <div className="table-responsive">
    <table className="table table-nowrap mb-0">
      <tbody>
        {items.map(([k, v], i) => <tr key={i}><th scope="row" className="text-muted fw-normal" style={{ width: "40%" }}>{k}</th><td>{v}</td></tr>)}
      </tbody>
    </table>
  </div>
)

export const Section = ({ title, actions, children }) => (
  <Card>
    <CardBody>
      {(title || actions) && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <h4 className="card-title mb-0 flex-grow-1">{title}</h4>
          {actions}
        </div>
      )}
      {children}
    </CardBody>
  </Card>
)

/** Confirm dialog; when `reasonLabel` is set a non-empty reason is required. */
export const ConfirmModal = ({ isOpen, title, text, reasonLabel, confirmText = "تأیید", color = "primary", onConfirm, onClose }) => {
  const [reason, setReason] = useState("")
  useEffect(() => { if (isOpen) setReason("") }, [isOpen])
  const blocked = reasonLabel && !reason.trim()
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>
        {text && <p>{text}</p>}
        {reasonLabel && (
          <>
            <label className="form-label" htmlFor="confirm-reason">{reasonLabel} *</label>
            <Input id="confirm-reason" type="textarea" rows={3} value={reason} onChange={e => setReason(e.target.value)} invalid={!!blocked} />
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose}>انصراف</Button>
        <Button color={color} disabled={!!blocked} onClick={() => onConfirm(reason.trim())}>{confirmText}</Button>
      </ModalFooter>
    </Modal>
  )
}

export const StatCard = ({ title, value, icon, color = "primary", hint }) => (
  <Card className="mini-stats-wid">
    <CardBody>
      <div className="d-flex">
        <div className="flex-grow-1">
          <p className="text-muted fw-medium">{title}</p>
          <h4 className="mb-0">{value}</h4>
          {hint && <p className="text-muted mb-0 mt-1 font-size-12">{hint}</p>}
        </div>
        <div className={`avatar-sm rounded-circle bg-${color} align-self-center mini-stat-icon`}>
          <span className={`avatar-title rounded-circle bg-${color}`}><i className={`bx ${icon} font-size-24`} /></span>
        </div>
      </div>
    </CardBody>
  </Card>
)

// The template's TableContainer with the panel's defaults: search, sorting, pagination.
export const DataTable = props => (
  <TableContainer
    isGlobalFilter isPagination isCustomPageSize
    SearchPlaceholder="جستجو..."
    tableClass="align-middle table-nowrap"
    theadClass="table-light"
    paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
    pagination="pagination"
    {...props}
  />
)
