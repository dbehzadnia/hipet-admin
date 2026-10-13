import React from "react"
import { Link } from "react-router-dom"
import { Badge } from "reactstrap"
import { Loading, Section, Status, useLoad } from "../../components/Common/HiPet"
import { getContactHistory } from "../../services/support"
import { canView } from "../../services/admins"
import { faDigits, jdatetime } from "../../utils/format"

/** Ticket and direct-message history shown on owner, clinic and vet detail pages. */
const ContactHistory = ({ type, id }) => {
  const [items] = useLoad(() => getContactHistory(type, id), [type, id])
  return (
    <Section title="سابقه تیکت‌ها و تماس‌ها">
      {!items ? <Loading /> : !items.length ? <p className="text-muted mb-0">سابقه‌ای ثبت نشده است.</p> : (
        <ul className="list-unstyled mb-0">
          {items.map(x => (
            <li key={x.kind + x.id} className="border-bottom py-2 d-flex gap-2 align-items-center">
              {x.kind === "ticket" ? (
                <>
                  <Badge color="primary">تیکت</Badge>
                  {canView("support") ? <Link to={`/support/${x.id}`}>{x.title} (#{faDigits(x.id)})</Link> : x.title}
                  <Status group="ticket" value={x.status} />
                </>
              ) : (
                <>
                  <Badge color="info">{x.kind === "sms" ? "پیامک" : "پوش"}</Badge>
                  <span className="text-truncate">{x.title}</span>
                </>
              )}
              <small className="text-muted ms-auto text-nowrap">{jdatetime(x.date)}</small>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export default ContactHistory
