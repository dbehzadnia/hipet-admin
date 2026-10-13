import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Badge, Button, Col, Container, Modal, ModalBody, ModalHeader, Nav, NavItem, NavLink, Row, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { ConfirmModal, DataTable, DateRange, FilterBar, InfoList, Loading, Section, SelectFilter, StatCard, Status, exportExcel, run, useLoad } from "../../components/Common/HiPet"
import { approveWithdrawal, listBalances, listWithdrawals, rejectWithdrawal } from "../../services/settlements"
import { canEdit, canView } from "../../services/admins"
import { faDigits, inRange, jdate, jdatetime, label, options, toman } from "../../utils/format"

const TABS = [["requests", "درخواست‌های برداشت"], ["balances", "مانده کلینیک‌ها"], ["history", "سابقه تسویه"]]
const Side = ({ balance }) => balance > 0 ? <Badge color="success">بستانکار</Badge> : balance < 0 ? <Badge color="danger">بدهکار</Badge> : <Badge color="secondary">تسویه</Badge>

const Settlements = () => {
  document.title = "تسویه کلینیک‌ها | های‌پت"
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") || "requests"
  const [withdrawals, reloadW] = useLoad(listWithdrawals)
  const [balances, reloadB] = useLoad(listBalances)
  const reload = () => { reloadW(); reloadB() }
  const [side, setSide] = useState("")
  const [status, setStatus] = useState("")
  const [range, setRange] = useState([null, null])
  const [view, setView] = useState(null) // withdrawal
  const [clinicView, setClinicView] = useState(null) // balance row
  const [rejecting, setRejecting] = useState(null)
  const editable = canEdit("settlements")

  const requests = useMemo(() => (withdrawals || []).filter(w => w.status === "pending" && inRange(w.requestedAt, range)), [withdrawals, range])
  const history = useMemo(() => (withdrawals || []).filter(w => w.status !== "pending" && (!status || w.status === status) && inRange(w.decidedAt, range)), [withdrawals, status, range])
  const balanceRows = useMemo(() => (balances || []).filter(b => !side || (side === "creditor" ? b.balance > 0 : b.balance < 0)), [balances, side])
  const totals = useMemo(() => (balances || []).reduce((s, b) => ({ owed: s.owed + Math.max(b.balance, 0), due: s.due + Math.max(-b.balance, 0) }), { owed: 0, due: 0 }), [balances])

  const clinicCell = ({ row: { original: r } }) => canView("clinics") ? <Link to={`/clinics/${r.clinicId}`}>{r.clinicName}</Link> : r.clinicName
  const wColumns = useMemo(() => [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => faDigits(c.getValue()) },
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true, cell: clinicCell },
    { header: "مبلغ", accessorKey: "amount", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "تاریخ درخواست", accessorKey: "requestedAt", enableSorting: true, cell: c => jdate(c.getValue()) },
    ...(tab === "history" ? [{ header: "تاریخ بررسی", accessorKey: "decidedAt", enableSorting: true, cell: c => jdate(c.getValue()) }] : [{ header: "مانده فعلی", accessorKey: "balance", enableSorting: true, cell: c => toman(c.getValue()) }]),
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="withdrawal" value={c.getValue()} /> },
    {
      header: "", id: "act", enableSorting: false, cell: ({ row: { original: w } }) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setView(w)}>جزئیات</Button>
          {editable && w.status === "pending" && <>
            <Button size="sm" color="success" onClick={() => run(approveWithdrawal(w.id), "درخواست تأیید شد", reload)}>تأیید</Button>
            <Button size="sm" color="danger" outline onClick={() => setRejecting(w)}>رد</Button>
          </>}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [tab, editable])
  const bColumns = useMemo(() => [
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true, cell: clinicCell },
    { header: "سهم کلینیک از پرداخت‌ها", accessorKey: "earned", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "تسویه‌شده", accessorKey: "paidOut", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "در انتظار برداشت", accessorKey: "pending", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "مانده", accessorKey: "balance", enableSorting: true, cell: c => <span className={c.getValue() < 0 ? "text-danger" : ""}>{toman(Math.abs(c.getValue()))}</span> },
    { header: "وضعیت", id: "side", accessorFn: b => b.balance, cell: c => <Side balance={c.getValue()} /> },
    { header: "", id: "act", enableSorting: false, cell: ({ row }) => <Button size="sm" color="light" onClick={() => setClinicView(row.original)}>جزئیات</Button> },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const exportBalances = () => exportExcel(balanceRows.map(b => ({
    "کلینیک": b.clinicName, "سهم کلینیک (تومان)": b.earned, "تسویه‌شده (تومان)": b.paidOut, "در انتظار برداشت (تومان)": b.pending,
    "مانده (تومان)": b.balance, "وضعیت": b.balance > 0 ? "بستانکار" : b.balance < 0 ? "بدهکار" : "تسویه",
  })), "hipet-clinic-balances")
  const exportHistory = () => exportExcel(history.map(w => ({
    "شناسه": w.id, "کلینیک": w.clinicName, "مبلغ (تومان)": w.amount, "شبا": w.iban, "تاریخ درخواست": jdate(w.requestedAt),
    "تاریخ بررسی": jdate(w.decidedAt), "وضعیت": label("withdrawal", w.status), "دلیل رد": w.reason,
  })), "hipet-settlement-history")

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="تسویه کلینیک‌ها" />
        <Row>
          <Col md={4}><StatCard title="درخواست‌های در انتظار" value={faDigits((withdrawals || []).filter(w => w.status === "pending").length)} icon="bx-time" color="warning" /></Col>
          <Col md={4}><StatCard title="بدهی های‌پت به کلینیک‌ها (بستانکاران)" value={toman(totals.owed)} icon="bx-transfer" color="success" /></Col>
          <Col md={4}><StatCard title="طلب های‌پت از کلینیک‌ها (بدهکاران)" value={toman(totals.due)} icon="bx-error" color="danger" /></Col>
        </Row>
        <Section actions={
          tab === "balances" ? <Button color="success" outline onClick={exportBalances}><i className="bx bx-download me-1" />خروجی اکسل</Button>
            : tab === "history" ? <Button color="success" outline onClick={exportHistory}><i className="bx bx-download me-1" />خروجی اکسل</Button> : null
        } title={TABS.find(t => t[0] === tab)[1]}>
          <Nav tabs className="nav-tabs-custom mb-3">
            {TABS.map(([k, t]) => <NavItem key={k}><NavLink href="#" active={tab === k} onClick={e => { e.preventDefault(); setParams({ tab: k }) }}>{t}</NavLink></NavItem>)}
          </Nav>
          {!withdrawals || !balances ? <Loading /> : tab === "balances" ? (
            <>
              <FilterBar><SelectFilter value={side} onChange={setSide} placeholder="بدهکار و بستانکار" options={[{ value: "creditor", text: "بستانکار" }, { value: "debtor", text: "بدهکار" }]} /></FilterBar>
              <DataTable columns={bColumns} data={balanceRows} SearchPlaceholder="جستجوی کلینیک..." />
            </>
          ) : (
            <>
              <FilterBar>
                {tab === "history" && <SelectFilter value={status} onChange={setStatus} placeholder="همه وضعیت‌ها" options={options("withdrawal").filter(o => o.value !== "pending")} />}
                <DateRange value={range} onChange={setRange} />
              </FilterBar>
              <DataTable columns={wColumns} data={tab === "requests" ? requests : history} SearchPlaceholder="جستجوی کلینیک یا شناسه..." />
            </>
          )}
        </Section>
      </Container>

      <Modal isOpen={!!view} toggle={() => setView(null)} centered>
        <ModalHeader toggle={() => setView(null)}>درخواست برداشت {view && faDigits(view.id)}</ModalHeader>
        <ModalBody>
          {view && <InfoList items={[
            ["کلینیک", view.clinicName], ["مبلغ", toman(view.amount)], ["شماره شبا", <span key="i" dir="ltr">{faDigits(view.iban)}</span>],
            ["تاریخ درخواست", jdatetime(view.requestedAt)], ["وضعیت", <Status key="s" group="withdrawal" value={view.status} />],
            ["تاریخ بررسی", jdatetime(view.decidedAt)], ["دلیل رد", view.reason || "—"],
          ]} />}
        </ModalBody>
      </Modal>

      <Modal isOpen={!!clinicView} toggle={() => setClinicView(null)} centered size="lg">
        <ModalHeader toggle={() => setClinicView(null)}>حساب {clinicView?.clinicName}</ModalHeader>
        <ModalBody>
          {clinicView && <>
            <InfoList items={[
              ["سهم کلینیک از پرداخت‌های آنلاین", toman(clinicView.earned)], ["تسویه‌شده", toman(clinicView.paidOut)],
              ["مانده", <span key="b">{toman(Math.abs(clinicView.balance))} <Side balance={clinicView.balance} /></span>],
            ]} />
            <h6 className="mt-4">سابقه درخواست‌های برداشت</h6>
            <Table size="sm" className="mb-0">
              <thead className="table-light"><tr><th>شناسه</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th></tr></thead>
              <tbody>
                {withdrawals.filter(w => w.clinicId === clinicView.clinicId).map(w => (
                  <tr key={w.id}><td>{faDigits(w.id)}</td><td>{toman(w.amount)}</td><td>{jdate(w.requestedAt)}</td><td><Status group="withdrawal" value={w.status} /></td></tr>
                ))}
              </tbody>
            </Table>
          </>}
        </ModalBody>
      </Modal>

      <ConfirmModal isOpen={!!rejecting} title="رد درخواست برداشت" color="danger" confirmText="رد درخواست" reasonLabel="دلیل رد"
        onClose={() => setRejecting(null)}
        onConfirm={async reason => { if (await run(rejectWithdrawal(rejecting.id, reason), "درخواست رد شد", reload)) setRejecting(null) }} />
    </div>
  )
}

export default Settlements
