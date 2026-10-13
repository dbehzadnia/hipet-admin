import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { ConfirmModal, DataTable, DateRange, FilterBar, InfoList, Loading, Section, SelectFilter, Status, exportExcel, run, useLoad } from "../../components/Common/HiPet"
import { listTransactions, refundTransaction } from "../../services/finance"
import { getLookups } from "../../services/appointments"
import { canEdit, canView } from "../../services/admins"
import { faDigits, inRange, jdatetime, label, options, toman } from "../../utils/format"

const Transactions = () => {
  document.title = "تراکنش‌ها | های‌پت"
  const [params] = useSearchParams()
  const [list, reload] = useLoad(listTransactions)
  const [lookups] = useLoad(getLookups)
  const [status, setStatus] = useState("")
  const [gateway, setGateway] = useState("")
  const [clinic, setClinic] = useState(params.get("clinic") || "")
  const [range, setRange] = useState([null, null])
  const appointment = params.get("appointment")
  const [view, setView] = useState(null)
  const [refunding, setRefunding] = useState(null)

  const gateways = useMemo(() => [...new Set((list || []).map(t => t.gateway))], [list])
  const rows = useMemo(() => (list || []).filter(t =>
    (!appointment || t.appointmentId === Number(appointment)) && (!status || t.status === status) &&
    (!gateway || t.gateway === gateway) && (!clinic || t.clinicId === Number(clinic)) && inRange(t.date, range)),
  [list, appointment, status, gateway, clinic, range])

  const columns = useMemo(() => [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => faDigits(c.getValue()) },
    { header: "تاریخ", accessorKey: "date", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "پرداخت‌کننده", accessorKey: "ownerName", enableSorting: true },
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true },
    { header: "مبلغ", accessorKey: "amount", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "درگاه", accessorKey: "gateway" },
    { header: "کد پیگیری", accessorKey: "refCode", cell: c => faDigits(c.getValue()) },
    { header: "وضعیت درگاه", accessorKey: "status", cell: c => <Status group="tx" value={c.getValue()} /> },
    { header: "", id: "act", enableSorting: false, cell: ({ row: { original: t } }) => <Button size="sm" color="light" onClick={() => setView(t)}>جزئیات</Button> },
  ], [])

  const doExport = () => exportExcel(rows.map(t => ({
    "شناسه": t.id, "تاریخ": jdatetime(t.date), "پرداخت‌کننده": t.ownerName, "کلینیک": t.clinicName, "نوبت": t.appointmentId,
    "مبلغ (تومان)": t.amount, "مبلغ کل نوبت (تومان)": t.price, "سهم های‌پت (تومان)": t.hipetShare, "سهم کلینیک (تومان)": t.clinicShare,
    "درگاه": t.gateway, "کد پیگیری": t.refCode, "وضعیت": label("tx", t.status), "دلیل بازگشت وجه": t.refund?.reason || "",
  })), "hipet-transactions")

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="مالی" breadcrumbItem="تراکنش‌ها" />
        <Section title={appointment ? `تراکنش‌های نوبت ${faDigits(appointment)}` : "تراکنش‌ها"}
          actions={list && <Button color="success" outline onClick={doExport}><i className="bx bx-download me-1" />خروجی اکسل</Button>}>
          <FilterBar>
            <SelectFilter value={status} onChange={setStatus} placeholder="همه وضعیت‌ها" options={options("tx")} />
            <SelectFilter value={gateway} onChange={setGateway} placeholder="همه درگاه‌ها" options={gateways.map(g => ({ value: g, text: g }))} />
            <SelectFilter value={clinic} onChange={setClinic} placeholder="همه کلینیک‌ها" options={(lookups?.clinics || []).map(c => ({ value: c.id, text: c.name }))} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجو: شناسه، کد پیگیری، نام..." /> : <Loading />}
        </Section>
      </Container>

      <Modal isOpen={!!view} toggle={() => setView(null)} centered size="lg">
        <ModalHeader toggle={() => setView(null)}>تراکنش {view && faDigits(view.id)}</ModalHeader>
        <ModalBody>
          {view && <InfoList items={[
            ["تاریخ", jdatetime(view.date)], ["پرداخت‌کننده", view.ownerName], ["کلینیک", view.clinicName],
            ["نوبت", canView("appointments") ? <Link key="a" to={`/appointments/${view.appointmentId}`}>{faDigits(view.appointmentId)}</Link> : faDigits(view.appointmentId)],
            ["مبلغ پرداختی (بیعانه)", toman(view.amount)], ["مبلغ کل نوبت", toman(view.price)],
            ["سهم های‌پت", toman(view.hipetShare)], ["سهم کلینیک", toman(view.clinicShare)],
            ["درگاه", view.gateway], ["کد پیگیری", faDigits(view.refCode)], ["وضعیت درگاه", <Status key="s" group="tx" value={view.status} />],
            ...(view.refund ? [["بازگشت وجه", `${view.refund.reason} — ${view.refund.adminName || ""} — ${jdatetime(view.refund.date)}`]] : []),
          ]} />}
        </ModalBody>
        {view && canEdit("finance") && view.status === "success" && (
          <ModalFooter><Button color="danger" onClick={() => setRefunding(view)}>بازگشت وجه</Button></ModalFooter>
        )}
      </Modal>

      <ConfirmModal isOpen={!!refunding} title={`بازگشت وجه ${refunding ? toman(refunding.amount) : ""}`} color="danger" confirmText="ثبت بازگشت وجه"
        reasonLabel="دلیل بازگشت وجه" onClose={() => setRefunding(null)}
        onConfirm={async reason => {
          if (await run(refundTransaction(refunding.id, reason), "بازگشت وجه ثبت شد", reload)) { setRefunding(null); setView(null) }
        }} />
    </div>
  )
}

export default Transactions
