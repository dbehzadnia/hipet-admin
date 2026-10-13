import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button, Container, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, InfoList, Loading, Section, SelectFilter, Status, run, useLoad } from "../../components/Common/HiPet"
import { listReviews, setReviewStatus } from "../../services/content"
import { canEdit, canView } from "../../services/admins"
import { faDigits, inRange, jdate, num, options } from "../../utils/format"

const Stars = ({ n }) => <span className="text-warning" aria-label={`${n} از ۵`}>{"★".repeat(n)}<span className="text-muted">{"★".repeat(5 - n)}</span></span>

const Reviews = () => {
  document.title = "نظرات | های‌پت"
  const [list, reload] = useLoad(listReviews)
  const [status, setStatus] = useState("pending")
  const [rating, setRating] = useState("")
  const [range, setRange] = useState([null, null])
  const [view, setView] = useState(null)
  const editable = canEdit("content")

  const rows = useMemo(() => (list || []).filter(r => (!status || r.status === status) && (!rating || r.rating === Number(rating)) && inRange(r.date, range)), [list, status, rating, range])
  const act = (r, s) => run(setReviewStatus(r.id, s), s === "approved" ? "نظر تأیید شد" : "نظر مخفی شد", reload).then(ok => ok && setView(null))

  const columns = useMemo(() => [
    { header: "تاریخ", accessorKey: "date", enableSorting: true, cell: c => jdate(c.getValue()) },
    { header: "کاربر", accessorKey: "ownerName", enableSorting: true },
    { header: "کلینیک", accessorKey: "clinicName", enableSorting: true },
    { header: "دامپزشک", accessorKey: "vetName" },
    { header: "امتیاز", accessorKey: "rating", enableSorting: true, cell: c => <Stars n={c.getValue()} /> },
    { header: "متن", accessorKey: "text", cell: c => <span className="d-inline-block text-truncate" style={{ maxWidth: 240 }}>{c.getValue()}</span> },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="review" value={c.getValue()} /> },
    {
      header: "", id: "act", enableSorting: false, cell: ({ row: { original: r } }) => (
        <div className="d-flex gap-2">
          <Button size="sm" color="light" onClick={() => setView(r)}>جزئیات</Button>
          {editable && r.status !== "approved" && <Button size="sm" color="success" outline onClick={() => act(r, "approved")}>تأیید</Button>}
          {editable && r.status !== "hidden" && <Button size="sm" color="secondary" outline onClick={() => act(r, "hidden")}>مخفی</Button>}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [editable])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="محتوا و تنظیمات" breadcrumbItem="نظرات" />
        <Section title="مدیریت نظرات">
          <FilterBar>
            <SelectFilter value={status} onChange={setStatus} placeholder="همه وضعیت‌ها" options={options("review")} />
            <SelectFilter value={rating} onChange={setRating} placeholder="همه امتیازها" options={[5, 4, 3, 2, 1].map(n => ({ value: n, text: `${num(n)} ستاره` }))} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجو در متن، کاربر، کلینیک..." /> : <Loading />}
        </Section>
      </Container>
      <Modal isOpen={!!view} toggle={() => setView(null)} centered>
        <ModalHeader toggle={() => setView(null)}>نظر {view && faDigits(view.id)}</ModalHeader>
        <ModalBody>
          {view && <InfoList items={[
            ["کاربر", canView("owners") ? <Link key="o" to={`/owners/${view.ownerId}`}>{view.ownerName}</Link> : view.ownerName],
            ["کلینیک", canView("clinics") ? <Link key="c" to={`/clinics/${view.clinicId}`}>{view.clinicName}</Link> : view.clinicName],
            ["دامپزشک", view.vetName], ["نوبت", faDigits(view.appointmentId)], ["تاریخ", jdate(view.date)],
            ["امتیاز", <Stars key="s" n={view.rating} />], ["وضعیت", <Status key="st" group="review" value={view.status} />], ["متن", view.text],
          ]} />}
        </ModalBody>
        {view && editable && (
          <ModalFooter>
            {view.status !== "approved" && <Button color="success" onClick={() => act(view, "approved")}>تأیید</Button>}
            {view.status !== "hidden" && <Button color="secondary" onClick={() => act(view, "hidden")}>مخفی‌سازی</Button>}
          </ModalFooter>
        )}
      </Modal>
    </div>
  )
}

export default Reviews
