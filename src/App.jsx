import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

// ====== اسم المشروع ======
const PROJECT_NAME = { ar: 'حساب مشروع التخرّج', en: 'Graduation Project Fund' }

// ====== النصوص ======
const STR = {
  ar: {
    balance: 'الرصيد المتبقّي', collected: 'إجمالي المساهمات', spent: 'إجمالي المصروفات',
    cashBox: 'النقدي', bankBox: 'البنكي',
    byMember: 'ملخّص الأعضاء', name: 'العضو', cash: 'نقدًا', bank: 'بنك', total: 'الإجمالي',
    contributions: 'المساهمات', expenses: 'المصروفات',
    addMember: 'إضافة عضو', addContribution: 'إضافة مساهمة', addExpense: 'إضافة مصروف',
    adminIn: 'دخول المشرف', adminOut: 'تسجيل الخروج', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    signIn: 'دخول', cancel: 'إلغاء', save: 'حفظ', saving: 'جارٍ الحفظ…', edit: 'تعديل',
    confirmDel: 'حذف هذا السجل؟', badInvoice: 'بدون فاتورة', invoice: 'بفاتورة',
    items: 'قيمة الأصناف', delivery: 'الشحن', paidBy: 'دفعها', method: 'طريقة الدفع', date: 'التاريخ', note: 'ملاحظة (اختياري)',
    memberName: 'اسم العضو', amount: 'المبلغ', selectMember: '— اختر العضو —',
    item: 'البيان (ما تم شراؤه)', vendor: 'المتجر / المورّد (اختياري)', price: 'السعر',
    deliveryOpt: 'قيمة الشحن (إن وُجد)', hasInvoice: 'توجد فاتورة',
    given: 'المبلغ المُسلَّم (اختياري)', change: 'المبلغ المتبقّي (اختياري)',
    whoPaid: '— من دفع (اختياري) —', photo: 'صورة الفاتورة أو المنتج', picked: 'تم اختيار:',
    receipt: 'عرض الفاتورة', noReceipt: 'لا توجد فاتورة', given_s: 'مُسلَّم', change_s: 'متبقٍّ',
    emptyMembers: 'لا يوجد أعضاء بعد', emptyContribs: 'لا توجد مساهمات بعد', emptyExpenses: 'لا توجد مصروفات بعد',
    loading: 'جارٍ التحميل…', badLogin: 'بيانات الدخول غير صحيحة',
    footView: 'وضع العرض', footAdmin: 'وضع المشرف', currency: 'ج.م',
    credit: 'تطوير: خالد وليد',
  },
  en: {
    balance: 'Remaining balance', collected: 'Total contributions', spent: 'Total expenses',
    cashBox: 'Cash', bankBox: 'Bank',
    byMember: 'By member', name: 'Member', cash: 'Cash', bank: 'Bank', total: 'Total',
    contributions: 'Contributions', expenses: 'Expenses',
    addMember: 'Add member', addContribution: 'Add contribution', addExpense: 'Add expense',
    adminIn: 'Admin sign in', adminOut: 'Sign out', email: 'Email', password: 'Password',
    signIn: 'Sign in', cancel: 'Cancel', save: 'Save', saving: 'Saving…', edit: 'Edit',
    confirmDel: 'Delete this entry?', badInvoice: 'No invoice', invoice: 'Invoice',
    items: 'Items', delivery: 'Delivery', paidBy: 'Paid by', method: 'Method', date: 'Date', note: 'Note (optional)',
    memberName: 'Member name', amount: 'Amount', selectMember: '— Select member —',
    item: 'Item (what was bought)', vendor: 'Vendor / store (optional)', price: 'Price',
    deliveryOpt: 'Delivery cost (if any)', hasInvoice: 'Has an invoice',
    given: 'Amount given (optional)', change: 'Change returned (optional)',
    whoPaid: '— Paid by (optional) —', photo: 'Receipt or item photo', picked: 'Selected:',
    receipt: 'View receipt', noReceipt: 'No receipt', given_s: 'given', change_s: 'change',
    emptyMembers: 'No members yet', emptyContribs: 'No contributions yet', emptyExpenses: 'No expenses yet',
    loading: 'Loading…', badLogin: 'Incorrect email or password',
    footView: 'View mode', footAdmin: 'Admin mode', currency: 'EGP',
    credit: 'Built by Khaled Walid',
  },
}

// ====== أدوات ======
const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
const numOrNull = (v) => (v === '' || v == null ? null : Number(v))
const strOrNull = (v) => (v && String(v).trim() !== '' ? String(v).trim() : null)
const today = () => new Date().toISOString().slice(0, 10)

async function compressImage(file, maxDim = 1400, quality = 0.7) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file)
  })
  const img = new Image(); img.src = dataUrl
  await new Promise((res) => (img.onload = res))
  let { width, height } = img
  if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim }
  else if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim }
  const c = document.createElement('canvas'); c.width = width; c.height = height
  c.getContext('2d').drawImage(img, 0, 0, width, height)
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', quality))
}
async function uploadReceipt(file) {
  const blob = await compressImage(file)
  const nm = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const { error } = await supabase.storage.from('receipts').upload(nm, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('receipts').getPublicUrl(nm).data.publicUrl
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const t = STR[lang]
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState([])
  const [contribs, setContribs] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [memberForm, setMemberForm] = useState(null)
  const [contribForm, setContribForm] = useState(null)
  const [expenseForm, setExpenseForm] = useState(null)

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.title = PROJECT_NAME[lang]
    localStorage.setItem('lang', lang)
  }, [lang])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const loadAll = useCallback(async () => {
    const [m, c, e] = await Promise.all([
      supabase.from('members').select('*').order('name'),
      supabase.from('contributions').select('*').order('paid_at', { ascending: false }),
      supabase.from('expenses').select('*').order('spent_at', { ascending: false }),
    ])
    setMembers(m.data || []); setContribs(c.data || []); setExpenses(e.data || []); setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) { setIsAdmin(false); return }
    supabase.from('admins').select('user_id').eq('user_id', session.user.id)
      .maybeSingle().then(({ data }) => setIsAdmin(!!data))
  }, [session])
  useEffect(() => {
    loadAll()
    const ch = supabase.channel('live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, loadAll)
      .subscribe()
    const onFocus = () => document.visibilityState === 'visible' && loadAll()
    document.addEventListener('visibilitychange', onFocus)
    return () => { supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onFocus) }
  }, [loadAll])

  const memberName = (id) => members.find((m) => m.id === id)?.name || '—'
  const totalIn = contribs.reduce((s, c) => s + Number(c.amount), 0)
  const totalOut = expenses.reduce((s, e) => s + Number(e.amount) + Number(e.delivery_amount || 0), 0)
  const balance = totalIn - totalOut
  const cashIn = contribs.filter((c) => c.method === 'cash').reduce((s, c) => s + Number(c.amount), 0)
  const bankIn = contribs.filter((c) => c.method === 'bank').reduce((s, c) => s + Number(c.amount), 0)
  const perMember = members.map((m) => {
    const mine = contribs.filter((c) => c.member_id === m.id)
    const cash = mine.filter((c) => c.method === 'cash').reduce((s, c) => s + Number(c.amount), 0)
    const bank = mine.filter((c) => c.method === 'bank').reduce((s, c) => s + Number(c.amount), 0)
    return { ...m, cash, bank, total: cash + bank }
  })
  const del = async (table, id) => {
    if (!confirm(t.confirmDel)) return
    await supabase.from(table).delete().eq('id', id); loadAll()
  }

  if (loading) return <div className="center">{t.loading}</div>

  return (
    <div className="app">
      <header className="topbar">
        <h1>{PROJECT_NAME[lang]}</h1>
        <div className="top-actions">
          <div className="lang" role="group">
            <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <button className="theme-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="theme">
            {theme === 'light' ? '🌙' : '☀'}
          </button>
          {isAdmin ? (
            <button className="btn ghost sm" onClick={() => supabase.auth.signOut()}>{t.adminOut}</button>
          ) : (
            <AdminLogin t={t} />
          )}
        </div>
      </header>

      {/* Dashboard */}
      <section className="dash">
        <span className="eyebrow">{t.balance}</span>
        <div className={`bal num ${balance < 0 ? 'neg' : ''}`}>{fmt(balance)} <i>{t.currency}</i></div>
        <div className="io">
          <div>
            <span className="k eyebrow"><i className="tick in" />{t.collected}</span>
            <span className="v in num">{fmt(totalIn)} {t.currency}</span>
          </div>
          <div>
            <span className="k eyebrow"><i className="tick out" />{t.spent}</span>
            <span className="v out num">{fmt(totalOut)} {t.currency}</span>
          </div>
        </div>
      </section>

      {/* Cash / Bank */}
      <div className="split">
        <div className="mini">
          <span className="eyebrow">{t.cashBox}</span>
          <span className="v num">{fmt(cashIn)} {t.currency}</span>
        </div>
        <div className="mini">
          <span className="eyebrow">{t.bankBox}</span>
          <span className="v num">{fmt(bankIn)} {t.currency}</span>
        </div>
      </div>

      {/* By member + Contributions */}
      <div className="two-col">
        <section>
          <div className="sec-head">
            <h2>{t.byMember}</h2><span className="rule" />
            {isAdmin && <button className="btn sm" onClick={() => setMemberForm({})}>+ {t.addMember}</button>}
          </div>
          {memberForm && (
            <MemberForm t={t} initial={memberForm} onDone={() => { setMemberForm(null); loadAll() }} onCancel={() => setMemberForm(null)} />
          )}
          <div className="ledger">
            <div className="mrow head">
              <span>{t.name}</span><span>{t.cash}</span><span>{t.bank}</span><span>{t.total}</span>
              <span className="acts" />
            </div>
            {perMember.map((m) => (
              <div className="mrow" key={m.id}>
                <span>{m.name}</span>
                <span className="num">{fmt(m.cash)}</span>
                <span className="num">{fmt(m.bank)}</span>
                <span className="num strong">{fmt(m.total)}</span>
                <span className="acts">
                  {isAdmin && (
                    <>
                      <button className="ic" onClick={() => setMemberForm(m)}>{t.edit}</button>
                      <button className="ic del" onClick={() => del('members', m.id)}>✕</button>
                    </>
                  )}
                </span>
              </div>
            ))}
            {perMember.length === 0 && <div className="empty">{t.emptyMembers}</div>}
          </div>
        </section>

        <section>
          <div className="sec-head">
            <h2>{t.contributions}</h2><span className="rule" />
            {isAdmin && <button className="btn sm" onClick={() => setContribForm({})}>+ {t.addContribution}</button>}
          </div>
          {contribForm && (
            <ContributionForm t={t} members={members} initial={contribForm}
              onDone={() => { setContribForm(null); loadAll() }} onCancel={() => setContribForm(null)} />
          )}
          <div className="ledger">
            {contribs.map((c) => (
              <div className="row" key={c.id}>
                <div className="info">
                  <b>{memberName(c.member_id)}</b>
                  <div className="meta">
                    <span>{c.method === 'cash' ? t.cash : t.bank}</span>
                    {c.note && <><span className="sep">/</span><span>{c.note}</span></>}
                  </div>
                </div>
                <div className="side">
                  <b className="in num">+ {fmt(c.amount)} {t.currency}</b>
                  <small>{c.paid_at}</small>
                  {isAdmin && (
                    <span className="acts">
                      <button className="ic" onClick={() => setContribForm(c)}>{t.edit}</button>
                      <button className="ic del" onClick={() => del('contributions', c.id)}>✕</button>
                    </span>
                  )}
                </div>
              </div>
            ))}
            {contribs.length === 0 && <div className="empty">{t.emptyContribs}</div>}
          </div>
        </section>
      </div>

      {/* Expenses */}
      <section>
        <div className="sec-head">
          <h2>{t.expenses}</h2><span className="rule" />
          {isAdmin && <button className="btn sm" onClick={() => setExpenseForm({})}>+ {t.addExpense}</button>}
        </div>
        {expenseForm && (
          <ExpenseForm t={t} members={members} initial={expenseForm}
            onDone={() => { setExpenseForm(null); loadAll() }} onCancel={() => setExpenseForm(null)} />
        )}
        <div className="ledger">
          {expenses.map((e) => {
            const hasDelivery = Number(e.delivery_amount) > 0
            const grand = Number(e.amount) + Number(e.delivery_amount || 0)
            return (
              <div className="exp" key={e.id}>
                <div className="exp-top">
                  <div className="exp-title">
                    <b>{e.title}</b>
                    {e.vendor && <em>{e.vendor}</em>}
                  </div>
                  <div className="exp-total">
                    <div className="num">{fmt(grand)} {t.currency}</div>
                    {isAdmin && (
                      <span className="acts" style={{ marginTop: 8 }}>
                        <button className="ic" onClick={() => setExpenseForm(e)}>{t.edit}</button>
                        <button className="ic del" onClick={() => del('expenses', e.id)}>✕</button>
                      </span>
                    )}
                  </div>
                </div>

                {hasDelivery && (
                  <div className="exp-break">
                    <div className="bk"><span>{t.items}</span><span className="num">{fmt(e.amount)}</span></div>
                    <div className="bk"><span>{t.delivery}</span><span className="num">{fmt(e.delivery_amount)}</span></div>
                    <div className="bk tot"><span>{t.total}</span><span className="num">{fmt(grand)} {t.currency}</span></div>
                  </div>
                )}

                {(e.amount_given != null || e.change_returned != null) && (
                  <span className="subtle num">
                    {e.amount_given != null && `${t.given_s} ${fmt(e.amount_given)}`}
                    {e.change_returned != null && ` · ${t.change_s} ${fmt(e.change_returned)}`}
                  </span>
                )}

                <div className="meta">
                  <span>{e.method === 'cash' ? t.cash : t.bank}</span>
                  <span className="sep">/</span>
                  <span className={e.has_invoice ? '' : 'is-out'}>{e.has_invoice ? t.invoice : t.badInvoice}</span>
                  {e.paid_by && <><span className="sep">/</span><span>{t.paidBy} {memberName(e.paid_by)}</span></>}
                </div>

                <div className="exp-foot">
                  {e.receipt_url ? (
                    <>
                      <a className="rlink" href={e.receipt_url} target="_blank" rel="noreferrer">{t.receipt}</a>
                      <a href={e.receipt_url} target="_blank" rel="noreferrer">
                        <img className="thumb" src={e.receipt_url} alt="" />
                      </a>
                    </>
                  ) : (
                    <span className="no-receipt">{t.noReceipt}</span>
                  )}
                  <small style={{ marginInlineStart: 'auto' }}>{e.spent_at}</small>
                </div>
              </div>
            )
          })}
          {expenses.length === 0 && <div className="empty">{t.emptyExpenses}</div>}
        </div>
      </section>

      <footer className="foot">
        {(isAdmin ? t.footAdmin : t.footView)} · {t.credit} · {new Date().getFullYear()}
      </footer>
    </div>
  )
}

function AdminLogin({ t }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const login = async () => {
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    setBusy(false)
    if (error) setErr(t.badLogin); else setOpen(false)
  }
  if (!open) return <button className="btn sm" onClick={() => setOpen(true)}>{t.adminIn}</button>
  return (
    <div className="login">
      <input placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder={t.password} value={pass} onChange={(e) => setPass(e.target.value)} />
      <button className="btn sm" disabled={busy} onClick={login}>{busy ? '…' : t.signIn}</button>
      <button className="btn ghost sm" onClick={() => setOpen(false)}>{t.cancel}</button>
      {err && <span className="err">{err}</span>}
    </div>
  )
}

function MemberForm({ t, initial, onDone, onCancel }) {
  const editing = !!initial?.id
  const [name, setName] = useState(initial?.name || '')
  const save = async () => {
    if (!name.trim()) return
    if (editing) await supabase.from('members').update({ name: name.trim() }).eq('id', initial.id)
    else await supabase.from('members').insert({ name: name.trim() })
    onDone()
  }
  return (
    <div className="form inline">
      <input placeholder={t.memberName} value={name} onChange={(e) => setName(e.target.value)} />
      <div className="form-actions">
        <button className="btn sm" onClick={save}>{t.save}</button>
        <button className="btn ghost sm" onClick={onCancel}>{t.cancel}</button>
      </div>
    </div>
  )
}

function ContributionForm({ t, members, initial, onDone, onCancel }) {
  const editing = !!initial?.id
  const [f, setF] = useState({
    member_id: initial?.member_id || '', amount: initial?.amount ?? '',
    method: initial?.method || 'cash', note: initial?.note || '', paid_at: initial?.paid_at || today(),
  })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const save = async () => {
    if (!f.member_id || f.amount === '') return
    const payload = { member_id: f.member_id, amount: Number(f.amount), method: f.method, note: strOrNull(f.note), paid_at: f.paid_at }
    if (editing) await supabase.from('contributions').update(payload).eq('id', initial.id)
    else await supabase.from('contributions').insert(payload)
    onDone()
  }
  return (
    <div className="form">
      <select value={f.member_id} onChange={(e) => set('member_id', e.target.value)}>
        <option value="">{t.selectMember}</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <input type="number" placeholder={t.amount} value={f.amount} onChange={(e) => set('amount', e.target.value)} />
      <select value={f.method} onChange={(e) => set('method', e.target.value)}>
        <option value="cash">{t.cash}</option><option value="bank">{t.bank}</option>
      </select>
      <input type="date" value={f.paid_at} onChange={(e) => set('paid_at', e.target.value)} />
      <input placeholder={t.note} value={f.note} onChange={(e) => set('note', e.target.value)} />
      <div className="form-actions">
        <button className="btn sm" onClick={save}>{t.save}</button>
        <button className="btn ghost sm" onClick={onCancel}>{t.cancel}</button>
      </div>
    </div>
  )
}

function ExpenseForm({ t, members, initial, onDone, onCancel }) {
  const editing = !!initial?.id
  const [busy, setBusy] = useState(false); const [file, setFile] = useState(null)
  const [f, setF] = useState({
    title: initial?.title || '', vendor: initial?.vendor || '', amount: initial?.amount ?? '',
    delivery_amount: initial?.delivery_amount ?? '', method: initial?.method || 'cash',
    has_invoice: initial?.has_invoice ?? true, amount_given: initial?.amount_given ?? '',
    change_returned: initial?.change_returned ?? '', paid_by: initial?.paid_by || '',
    note: initial?.note || '', spent_at: initial?.spent_at || today(),
  })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const save = async () => {
    if (!f.title.trim() || f.amount === '') return
    setBusy(true)
    try {
      let receipt_url = initial?.receipt_url || null
      if (file) receipt_url = await uploadReceipt(file)
      const payload = {
        title: f.title.trim(), vendor: strOrNull(f.vendor), amount: Number(f.amount),
        delivery_amount: Number(f.delivery_amount || 0), method: f.method, has_invoice: f.has_invoice,
        amount_given: numOrNull(f.amount_given), change_returned: numOrNull(f.change_returned),
        paid_by: f.paid_by || null, receipt_url, note: strOrNull(f.note), spent_at: f.spent_at,
      }
      if (editing) await supabase.from('expenses').update(payload).eq('id', initial.id)
      else await supabase.from('expenses').insert(payload)
      onDone()
    } catch (err) { alert(err.message) } finally { setBusy(false) }
  }
  return (
    <div className="form">
      <input placeholder={t.item} value={f.title} onChange={(e) => set('title', e.target.value)} />
      <input placeholder={t.vendor} value={f.vendor} onChange={(e) => set('vendor', e.target.value)} />
      <input type="number" placeholder={t.price} value={f.amount} onChange={(e) => set('amount', e.target.value)} />
      <input type="number" placeholder={t.deliveryOpt} value={f.delivery_amount} onChange={(e) => set('delivery_amount', e.target.value)} />
      <select value={f.method} onChange={(e) => set('method', e.target.value)}>
        <option value="cash">{t.cash}</option><option value="bank">{t.bank}</option>
      </select>
      <label className="check">
        <input type="checkbox" checked={f.has_invoice} onChange={(e) => set('has_invoice', e.target.checked)} />
        {t.hasInvoice}
      </label>
      {!f.has_invoice && (
        <>
          <input type="number" placeholder={t.given} value={f.amount_given} onChange={(e) => set('amount_given', e.target.value)} />
          <input type="number" placeholder={t.change} value={f.change_returned} onChange={(e) => set('change_returned', e.target.value)} />
        </>
      )}
      <select value={f.paid_by} onChange={(e) => set('paid_by', e.target.value)}>
        <option value="">{t.whoPaid}</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <input type="date" value={f.spent_at} onChange={(e) => set('spent_at', e.target.value)} />
      <label className="file">📷 {t.photo}
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
      </label>
      {file && <small className="picked">{t.picked} {file.name}</small>}
      <input placeholder={t.note} value={f.note} onChange={(e) => set('note', e.target.value)} />
      <div className="form-actions">
        <button className="btn sm" onClick={save} disabled={busy}>{busy ? t.saving : t.save}</button>
        <button className="btn ghost sm" onClick={onCancel}>{t.cancel}</button>
      </div>
    </div>
  )
}