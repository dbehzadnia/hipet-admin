import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button, ButtonGroup, Col, Container, Row } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, Loading, Section, StatCard, exportExcel, useLoad } from "../../components/Common/HiPet"
import { getClinicFinanceReport, getFinanceReport } from "../../services/finance"
import { jdate, jmonth, num, toman } from "../../utils/format"

const PERIODS = [["daily", "روزانه"], ["weekly", "هفتگی"], ["monthly", "ماهانه"]]
const periodLabel = (period, start) => period === "monthly" ? jmonth(start) : period === "weekly" ? `هفته ${jdate(start)}` : jdate(start)

const FinanceReports = () => {
  document.title = "گزارش‌های مالی | های‌پت"
  const [period, setPeriod] = useState("daily")
  const [range, setRange] = useState([null, null])
  const [report] = useLoad(() => getFinanceReport(period, range), [period, range])
  const [byClinic] = useLoad(() => getClinicFinanceReport(range), [range])

  const totals = useMemo(() => (report || []).reduce((s, r) => ({
    gross: s.gross + r.gross, hipet: s.hipet + r.hipetShare, clinic: s.clinic + r.clinicShare, refunds: s.refunds + r.refunds,
  }), { gross: 0, hipet: 0, clinic: 0, refunds: 0 }), [report])

  const columns = useMemo(() => [
    { header: "دوره", accessorKey: "start", enableSorting: true, cell: c => periodLabel(period, c.getValue()) },
    { header: "تعداد پرداخت", accessorKey: "count", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "گردش کل", accessorKey: "gross", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "سهم های‌پت", accessorKey: "hipetShare", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "سهم کلینیک", accessorKey: "clinicShare", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "بیعانه دریافتی", accessorKey: "deposits", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "بازگشت وجه", accessorKey: "refunds", enableSorting: true, cell: c => toman(c.getValue()) },
  ], [period])
  const clinicColumns = useMemo(() => [
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true, cell: ({ row: { original: r } }) => <Link to={`/finance/transactions?clinic=${r.clinicId}`}>{r.clinicName}</Link> },
    { header: "تعداد پرداخت", accessorKey: "count", enableSorting: true, cell: c => num(c.getValue()) },
    { header: "گردش کل", accessorKey: "gross", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "سهم های‌پت", accessorKey: "hipetShare", enableSorting: true, cell: c => toman(c.getValue()) },
    { header: "سهم کلینیک", accessorKey: "clinicShare", enableSorting: true, cell: c => toman(c.getValue()) },
  ], [])

  const chartRows = (report || []).slice(0, 14).reverse()
  const chart = {
    chart: { toolbar: { show: false }, stacked: true, fontFamily: "yekan, sans-serif" },
    colors: ["#556ee6", "#34c38f"],
    dataLabels: { enabled: false },
    legend: { position: "top" },
    xaxis: { categories: chartRows.map(r => periodLabel(period, r.start)) },
    yaxis: { labels: { formatter: v => num(Math.round(v / 1e6)) + " م" } },
    tooltip: { y: { formatter: v => toman(v) } },
    plotOptions: { bar: { columnWidth: "50%" } },
  }

  const exportReport = () => exportExcel(report.map(r => ({
    "دوره": periodLabel(period, r.start), "تعداد پرداخت": r.count, "گردش کل (تومان)": r.gross, "سهم های‌پت (تومان)": r.hipetShare,
    "سهم کلینیک (تومان)": r.clinicShare, "بیعانه دریافتی (تومان)": r.deposits, "بازگشت وجه (تومان)": r.refunds,
  })), `hipet-finance-${period}`)
  const exportClinics = () => exportExcel(byClinic.map(r => ({
    "کلینیک": r.clinicName, "تعداد پرداخت": r.count, "گردش کل (تومان)": r.gross, "سهم های‌پت (تومان)": r.hipetShare, "سهم کلینیک (تومان)": r.clinicShare,
  })), "hipet-finance-clinics")

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="مالی" breadcrumbItem="گزارش‌های مالی" />
        <FilterBar>
          <ButtonGroup className="w-100">
            {PERIODS.map(([k, t]) => <Button key={k} color="primary" outline={period !== k} onClick={() => setPeriod(k)}>{t}</Button>)}
          </ButtonGroup>
          <DateRange value={range} onChange={setRange} />
        </FilterBar>
        <Row>
          <Col md={3}><StatCard title="گردش کل" value={toman(totals.gross)} icon="bx-money" /></Col>
          <Col md={3}><StatCard title="سهم های‌پت" value={toman(totals.hipet)} icon="bx-wallet" color="success" /></Col>
          <Col md={3}><StatCard title="سهم کلینیک‌ها" value={toman(totals.clinic)} icon="bx-clinic" color="info" /></Col>
          <Col md={3}><StatCard title="بازگشت وجه" value={toman(totals.refunds)} icon="bx-undo" color="danger" /></Col>
        </Row>
        <Section title="سهم های‌پت و کلینیک‌ها">
          {report ? <ReactApexChart type="bar" height={300} options={chart}
            series={[{ name: "سهم های‌پت", data: chartRows.map(r => r.hipetShare) }, { name: "سهم کلینیک", data: chartRows.map(r => r.clinicShare) }]} /> : <Loading />}
        </Section>
        <Section title={`گزارش ${PERIODS.find(p => p[0] === period)[1]}`} actions={report && <Button color="success" outline onClick={exportReport}><i className="bx bx-download me-1" />خروجی اکسل</Button>}>
          {report ? <DataTable columns={columns} data={report} /> : <Loading />}
        </Section>
        <Section title="گزارش به تفکیک کلینیک" actions={byClinic && <Button color="success" outline onClick={exportClinics}><i className="bx bx-download me-1" />خروجی اکسل</Button>}>
          {byClinic ? <DataTable columns={clinicColumns} data={byClinic} SearchPlaceholder="جستجوی کلینیک..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default FinanceReports
