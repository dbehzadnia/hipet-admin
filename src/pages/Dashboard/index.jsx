import React from "react"
import { Link } from "react-router-dom"
import { Badge, Col, Container, Row } from "reactstrap"
import ReactApexChart from "react-apexcharts"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { Loading, Section, StatCard, useLoad } from "../../components/Common/HiPet"
import { getDashboard } from "../../services/dashboard"
import { canView } from "../../services/admins"
import { faDigits, jdate, jdatetime, num, pct, toman } from "../../utils/format"

const chartBase = {
  chart: { toolbar: { show: false }, fontFamily: "yekan, sans-serif" },
  dataLabels: { enabled: false },
  grid: { borderColor: "#f1f1f1" },
  legend: { position: "top" },
}

const Dashboard = () => {
  document.title = "داشبورد | های‌پت"
  const [d] = useLoad(getDashboard)
  if (!d) return <div className="page-content"><Loading /></div>

  const labels = d.days.map(x => jdate(x.date).slice(5))
  const visits = {
    ...chartBase,
    colors: ["#556ee6"],
    xaxis: { categories: labels },
    yaxis: { labels: { formatter: v => num(v) } },
    tooltip: { y: { formatter: v => `${num(v)} ویزیت` } },
    plotOptions: { bar: { columnWidth: "45%", borderRadius: 4 } },
  }
  const revenue = {
    ...chartBase,
    colors: ["#34c38f", "#f1b44c"],
    stroke: { curve: "smooth", width: 3 },
    xaxis: { categories: labels },
    yaxis: { labels: { formatter: v => num(Math.round(v / 1e6)) + " م" } },
    tooltip: { y: { formatter: v => toman(v) } },
  }
  const a = d.alerts

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="داشبورد" />
        <Row>
          <Col md={6} xl={3}><StatCard title="نوبت‌های امروز" value={num(d.todayAppointments)} icon="bx-calendar" /></Col>
          <Col md={6} xl={3}><StatCard title="کلینیک‌های فعال" value={num(d.activeClinics)} icon="bx-clinic" color="success" /></Col>
          <Col md={6} xl={3}><StatCard title="دامپزشکان فعال" value={num(d.activeVets)} icon="bx-plus-medical" color="info" /></Col>
          <Col md={6} xl={3}><StatCard title="کاربران فعال (۳۰ روز)" value={num(d.activeUsers)} icon="bx-group" color="warning" /></Col>
          <Col md={6} xl={3}><StatCard title="درآمد های‌پت (۳۰ روز)" value={toman(d.monthRevenue)} hint={`گردش کل: ${toman(d.monthGross)}`} icon="bx-money" color="success" /></Col>
          <Col md={6} xl={3}>
            <Link to="/clinics/requests"><StatCard title="درخواست ثبت‌نام کلینیک (در انتظار)" value={num(d.pendingClinicRequests)} icon="bx-store" color="primary" /></Link>
          </Col>
          <Col md={6} xl={3}>
            <Link to="/vets?verification=pending"><StatCard title="درخواست ثبت‌نام دامپزشک (در انتظار)" value={num(d.pendingVetRequests)} icon="bx-user-check" color="info" /></Link>
          </Col>
          <Col md={6} xl={3}>
            <StatCard title="نرخ لغو / عدم حضور (۳۰ روز)" value={`${pct(d.cancelled, d.last30Total)} / ${pct(d.noShows, d.last30Total)}`}
              hint={`${num(d.cancelled)} لغو و ${num(d.noShows)} عدم حضور از ${num(d.last30Total)} نوبت`} icon="bx-x-circle" color="danger" />
          </Col>
        </Row>

        <Row>
          <Col xl={6}>
            <Section title="ویزیت‌های روزانه (۱۴ روز اخیر)">
              <ReactApexChart type="bar" height={300} options={visits} series={[{ name: "ویزیت", data: d.days.map(x => x.visits) }]} />
            </Section>
          </Col>
          <Col xl={6}>
            <Section title="گزارش درآمد روزانه (۱۴ روز اخیر)">
              <ReactApexChart type="line" height={300} options={revenue}
                series={[{ name: "سهم های‌پت", data: d.days.map(x => x.revenue) }, { name: "گردش کل", data: d.days.map(x => x.gross) }]} />
            </Section>
          </Col>
        </Row>

        <Section title="هشدارها">
          <Row>
            <Col lg={4}>
              <h6 className="mb-3"><i className="bx bx-error text-warning me-1" />کلینیک‌های بدون نوبت در ۷ روز اخیر <Badge color="warning" pill>{num(a.idleClinics.length)}</Badge></h6>
              <ul className="list-unstyled mb-0">
                {a.idleClinics.slice(0, 8).map(c => (
                  <li key={c.id} className="mb-2">
                    {canView("clinics") ? <Link to={`/clinics/${c.id}`}>{c.name}</Link> : c.name}
                    <small className="text-muted ms-2">آخرین نوبت: {c.lastBooking ? jdate(c.lastBooking) : "هیچ"}</small>
                  </li>
                ))}
                {!a.idleClinics.length && <li className="text-muted">موردی نیست</li>}
              </ul>
            </Col>
            <Col lg={4}>
              <h6 className="mb-3"><i className="bx bx-credit-card text-danger me-1" />پرداخت‌های ناموفق (۷ روز) <Badge color="danger" pill>{num(a.failedPayments.length)}</Badge></h6>
              <ul className="list-unstyled mb-0">
                {a.failedPayments.slice(0, 8).map(t => (
                  <li key={t.id} className="mb-2">
                    {canView("appointments") ? <Link to={`/appointments/${t.appointmentId}`}>نوبت {faDigits(t.appointmentId)}</Link> : `نوبت ${faDigits(t.appointmentId)}`}
                    <small className="text-muted ms-2">{t.clinicName} - {toman(t.amount)} - {jdatetime(t.date)}</small>
                  </li>
                ))}
                {!a.failedPayments.length && <li className="text-muted">موردی نیست</li>}
              </ul>
            </Col>
            <Col lg={4}>
              <h6 className="mb-3"><i className="bx bx-message-square-dots text-info me-1" />تیکت‌های باز پشتیبانی</h6>
              <h2 className="mb-2">{num(a.openTickets)}</h2>
              {canView("support") && <Link to="/support?status=open" className="btn btn-sm btn-outline-primary">مشاهده تیکت‌ها</Link>}
            </Col>
          </Row>
        </Section>
      </Container>
    </div>
  )
}

export default Dashboard
