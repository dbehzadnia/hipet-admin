import React, { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Container } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { DataTable, DateRange, FilterBar, Loading, Section, SelectFilter, Status, useLoad } from "../../components/Common/HiPet"
import { listTickets } from "../../services/support"
import { faDigits, inRange, jdatetime, options } from "../../utils/format"

const TicketsList = () => {
  document.title = "پشتیبانی | های‌پت"
  const [params] = useSearchParams()
  const [list] = useLoad(listTickets)
  const [sender, setSender] = useState("")
  const [status, setStatus] = useState(params.get("status") || "")
  const [priority, setPriority] = useState("")
  const [range, setRange] = useState([null, null])

  const rows = useMemo(() => (list || []).filter(t =>
    (!sender || t.senderType === sender) && (!status || t.status === status) && (!priority || t.priority === priority) && inRange(t.createdAt, range)),
  [list, sender, status, priority, range])

  const columns = useMemo(() => [
    { header: "شناسه", accessorKey: "id", enableSorting: true, cell: c => <Link to={`/support/${c.getValue()}`}>#{faDigits(c.getValue())}</Link> },
    { header: "موضوع", accessorKey: "subject", enableSorting: true },
    { header: "فرستنده", accessorKey: "senderName", enableSorting: true },
    { header: "نوع فرستنده", accessorKey: "senderType", cell: c => <Status group="sender" value={c.getValue()} /> },
    { header: "اولویت", accessorKey: "priority", enableSorting: true, cell: c => <Status group="priority" value={c.getValue()} /> },
    { header: "وضعیت", accessorKey: "status", cell: c => <Status group="ticket" value={c.getValue()} /> },
    { header: "ایجاد", accessorKey: "createdAt", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "آخرین پیام", accessorKey: "lastAt", enableSorting: true, cell: c => jdatetime(c.getValue()) },
    { header: "", id: "go", enableSorting: false, cell: ({ row }) => <Link to={`/support/${row.original.id}`} className="btn btn-sm btn-light">مشاهده</Link> },
  ], [])

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="های‌پت" breadcrumbItem="پشتیبانی" />
        <Section title="تیکت‌ها">
          <FilterBar>
            <SelectFilter value={sender} onChange={setSender} placeholder="همه فرستنده‌ها" options={options("sender")} />
            <SelectFilter value={status} onChange={setStatus} placeholder="همه وضعیت‌ها" options={options("ticket")} />
            <SelectFilter value={priority} onChange={setPriority} placeholder="همه اولویت‌ها" options={options("priority")} />
            <DateRange value={range} onChange={setRange} />
          </FilterBar>
          {list ? <DataTable columns={columns} data={rows} SearchPlaceholder="جستجوی موضوع یا فرستنده..." /> : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default TicketsList
