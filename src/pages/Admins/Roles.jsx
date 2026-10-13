import React, { useEffect, useState } from "react"
import { Button, Container, Input, Table } from "reactstrap"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { Loading, Section, run, useLoad } from "../../components/Common/HiPet"
import { SECTIONS, canEdit, listRoles, updateRolePermissions } from "../../services/admins"

const LEVELS = [["none", "بدون دسترسی"], ["view", "مشاهده"], ["edit", "مشاهده و ویرایش"]]

const Roles = () => {
  document.title = "نقش‌ها و دسترسی‌ها | های‌پت"
  const [roles, reload] = useLoad(listRoles)
  const [draft, setDraft] = useState(null)
  const editable = canEdit("admins")
  useEffect(() => { if (roles) setDraft(structuredClone(roles)) }, [roles])

  const set = (key, section, value) => setDraft(draft.map(r => r.key === key ? { ...r, permissions: { ...r.permissions, [section]: value } } : r))
  const changed = r => JSON.stringify(r.permissions) !== JSON.stringify(roles.find(x => x.key === r.key).permissions)

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="مدیریت ادمین‌ها" breadcrumbItem="نقش‌ها و دسترسی‌ها" />
        <Section title="دسترسی هر نقش به بخش‌های پنل">
          <p className="text-muted">منوی کناری و دکمه‌های عملیات بر اساس همین جدول برای هر ادمین نمایش داده می‌شود. دسترسی «مدیر ارشد» ثابت است.</p>
          {draft ? (
            <div className="table-responsive">
              <Table className="align-middle table-nowrap">
                <thead className="table-light">
                  <tr><th>بخش</th>{draft.map(r => <th key={r.key}>{r.name}</th>)}</tr>
                </thead>
                <tbody>
                  {Object.entries(SECTIONS).map(([sec, name]) => (
                    <tr key={sec}>
                      <td>{name}</td>
                      {draft.map(r => (
                        <td key={r.key}>
                          <Input type="select" bsSize="sm" aria-label={`${r.name} - ${name}`} value={r.permissions[sec]}
                            disabled={!editable || r.key === "super_admin"} onChange={e => set(r.key, sec, e.target.value)}>
                            {LEVELS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                          </Input>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {editable && (
                  <tfoot>
                    <tr>
                      <td />
                      {draft.map(r => (
                        <td key={r.key}>
                          {r.key !== "super_admin" && (
                            <Button size="sm" color="primary" disabled={!changed(r)}
                              onClick={() => run(updateRolePermissions(r.key, r.permissions), `دسترسی نقش «${r.name}» ذخیره شد`, reload)}>
                              ذخیره
                            </Button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          ) : <Loading />}
        </Section>
      </Container>
    </div>
  )
}

export default Roles
