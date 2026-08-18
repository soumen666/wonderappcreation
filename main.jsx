import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const KEY = 'puja-finance-manager-v1';
const OPTIONS = {
  subType: ['Subscription', 'Advertisement', 'Sponsorship'],
  paymentMode: ['Cash', 'UPI', 'Cheque', 'NEFT/RTGS', 'Auto Credit / Direct'],
  subStatus: ['Received', 'Pending'],
  incomeCategory: ['Bank Interest', 'Donation', 'Stall Rent', 'Other'],
  expenseCategory: ['Idol', 'Pandal', 'Light', 'Dhak', 'Bhog', 'Priest', 'Cultural', 'Printing', 'Misc']
};

const today = () => new Date().toISOString().slice(0, 10);
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(Number(n) || 0);
const dateFmt = s => s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.subscriptions && saved?.incomes && saved?.expenses) return saved;
  } catch {}
  return { subscriptions: [], incomes: [], expenses: [] };
}

function saveData(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

function Icon({ name }) {
  const paths = {
    home: 'M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10zm6 12V12h6v10',
    users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m6-10a4 4 0 100-8 4 4 0 000 8zm12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
    income: 'M3 17l6-6 4 4 8-9M15 6h6v6',
    expense: 'M3 7l6 6 4-4 8 9M15 18h6v-6',
    plus: 'M12 5v14M5 12h14',
    edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4L16.5 3.5z',
    trash: 'M3 6h18M8 6V4h8v2m-9 0l1 16h8l1-16M10 10v8M14 10v8',
    download: 'M12 3v12m0 0l5-5m-5 5l-5-5M4 21h16',
    print: 'M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6z',
    search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35',
    database: 'M21 5c0 1.66-4 3-9 3S3 6.66 3 5s4-3 9-3 9 1.34 9 3zm0 0v14c0 1.66-4 3-9 3s-9-1.34-9-3V5m18 7c0 1.66-4 3-9 3s-9-1.34-9-3',
    close: 'M18 6L6 18M6 6l12 12'
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.home}/></svg>;
}

function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => saveData(data), [data]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); } }, [toast]);

  const totals = useMemo(() => {
    const subReceived = data.subscriptions.filter(x => x.status === 'Received').reduce((a, x) => a + Number(x.amount), 0);
    const subPending = data.subscriptions.filter(x => x.status === 'Pending').reduce((a, x) => a + Number(x.amount), 0);
    const income = data.incomes.filter(x => x.status === 'Received').reduce((a, x) => a + Number(x.amount), 0);
    const expenses = data.expenses.reduce((a, x) => a + Number(x.amount), 0);
    return { subReceived, subPending, income, expenses, balance: subReceived + income - expenses };
  }, [data]);

  function openAdd(type) { setEditing(null); setModal(type); }
  function openEdit(type, item) { setEditing(item); setModal(type); }
  function closeModal() { setModal(null); setEditing(null); }

  function saveEntry(type, form) {
    const collection = type === 'subscription' ? 'subscriptions' : type === 'income' ? 'incomes' : 'expenses';
    const normalized = {
      ...form,
      id: editing?.id || uid(),
      timestamp: editing?.timestamp || Date.now(),
      amount: Number(form.amount) || 0
    };
    if (type === 'income') normalized.source = normalized.name;
    if (type === 'expense') normalized.payee = normalized.name;
    setData(prev => ({ ...prev, [collection]: editing ? prev[collection].map(x => x.id === editing.id ? normalized : x) : [normalized, ...prev[collection]] }));
    setToast(editing ? 'Entry updated' : 'Entry saved');
    closeModal();
  }

  function remove(type, item) {
    if (!confirm(`Delete this ${type}?`)) return;
    const collection = type === 'subscription' ? 'subscriptions' : type === 'income' ? 'incomes' : 'expenses';
    setData(prev => ({ ...prev, [collection]: prev[collection].filter(x => x.id !== item.id) }));
    setToast('Entry deleted');
  }

  function exportCSV(type) {
    const rows = type === 'all' ? [...data.subscriptions.map(x => ({ ...x, recordType: 'Subscription' })), ...data.incomes.map(x => ({ ...x, recordType: 'Income' })), ...data.expenses.map(x => ({ ...x, recordType: 'Expense' }))] : data[type];
    if (!rows.length) { setToast('No records to export'); return; }
    const keys = Object.keys(rows[0]).filter(k => !['id', 'timestamp'].includes(k));
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `puja-finance-${type}-${today()}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  function resetAll() {
    if (!confirm('Delete ALL saved records from this device?')) return;
    setData({ subscriptions: [], incomes: [], expenses: [] });
    setToast('All records cleared');
  }

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="brandIcon">ॐ</div><div><b>Puja Finance Manager</b><small>Subscription • Income • Expense</small></div></div>
      <button className="printBtn" onClick={() => window.print()}><Icon name="print"/> Print</button>
    </header>

    <div className="layout">
      <aside className="sidebar">
        <NavButton icon="home" label="Dashboard" active={view==='dashboard'} onClick={() => setView('dashboard')}/>
        <NavButton icon="users" label="Subscriptions" active={view==='subscriptions'} onClick={() => setView('subscriptions')}/>
        <NavButton icon="income" label="Other Income" active={view==='incomes'} onClick={() => setView('incomes')}/>
        <NavButton icon="expense" label="Expenses" active={view==='expenses'} onClick={() => setView('expenses')}/>
        <div className="sideBottom"><NavButton icon="database" label="Data & Backup" active={view==='settings'} onClick={() => setView('settings')}/></div>
      </aside>

      <main className="main">
        {view === 'dashboard' && <Dashboard totals={totals} data={data} onNavigate={setView}/>} 
        {view === 'subscriptions' && <RecordPage title="Subscriptions" type="subscription" rows={data.subscriptions} query={query} setQuery={setQuery} onAdd={() => openAdd('subscription')} onEdit={x=>openEdit('subscription',x)} onDelete={x=>remove('subscription',x)} onExport={()=>exportCSV('subscriptions')}/>} 
        {view === 'incomes' && <RecordPage title="Other Income" type="income" rows={data.incomes} query={query} setQuery={setQuery} onAdd={() => openAdd('income')} onEdit={x=>openEdit('income',x)} onDelete={x=>remove('income',x)} onExport={()=>exportCSV('incomes')}/>} 
        {view === 'expenses' && <RecordPage title="Expenses" type="expense" rows={data.expenses} query={query} setQuery={setQuery} onAdd={() => openAdd('expense')} onEdit={x=>openEdit('expense',x)} onDelete={x=>remove('expense',x)} onExport={()=>exportCSV('expenses')}/>} 
        {view === 'settings' && <Settings onExport={()=>exportCSV('all')} onReset={resetAll}/>} 
      </main>
    </div>

    <nav className="mobileNav">
      <NavButton icon="home" label="Home" active={view==='dashboard'} onClick={()=>setView('dashboard')}/>
      <NavButton icon="users" label="Subs" active={view==='subscriptions'} onClick={()=>setView('subscriptions')}/>
      <NavButton icon="income" label="Income" active={view==='incomes'} onClick={()=>setView('incomes')}/>
      <NavButton icon="expense" label="Expense" active={view==='expenses'} onClick={()=>setView('expenses')}/>
      <NavButton icon="database" label="Data" active={view==='settings'} onClick={()=>setView('settings')}/>
    </nav>

    {modal && <EntryModal type={modal} initial={editing} existing={data} onClose={closeModal} onSave={saveEntry}/>} 
    {toast && <div className="toast">{toast}</div>}
  </div>;
}

function NavButton({icon,label,active,onClick}) { return <button className={`navBtn ${active?'active':''}`} onClick={onClick}><Icon name={icon}/><span>{label}</span></button>; }

function Dashboard({ totals, data, onNavigate }) {
  const activity = [...data.subscriptions.map(x=>({...x,kind:'Subscription',name:x.name,sign:1})), ...data.incomes.map(x=>({...x,kind:'Income',name:x.source,sign:1})), ...data.expenses.map(x=>({...x,kind:'Expense',name:x.payee,sign:-1}))].sort((a,b)=>b.timestamp-a.timestamp).slice(0,6);
  return <div className="page">
    <div className="pageHead"><div><h1>Financial Overview</h1><p>Track the Puja committee's money in one place.</p></div><button className="primary" onClick={()=>onNavigate('subscriptions')}><Icon name="plus"/> New Entry</button></div>
    <section className="stats">
      <Stat title="Net Balance" value={totals.balance} tone={totals.balance>=0?'green':'red'}/>
      <Stat title="Total Expenses" value={totals.expenses} tone="red"/>
      <Stat title="Subscriptions Received" value={totals.subReceived} tone="blue" sub={`Pending ${money(totals.subPending)}`}/>
      <Stat title="Other Income" value={totals.income} tone="blue"/>
    </section>
    <div className="grid2">
      <section className="card"><div className="cardHead"><h2>Recent Activity</h2><button className="linkBtn" onClick={()=>onNavigate('expenses')}>View records</button></div>
        {activity.length ? <div className="activity">{activity.map(x=><div className="activityRow" key={x.id}><div><b>{x.name || 'Entry'}</b><small>{x.kind} • {dateFmt(x.date)}</small></div><strong className={x.sign>0?'pos':'neg'}>{x.sign>0?'+':'-'}{money(x.amount)}</strong></div>)}</div> : <Empty text="No transactions yet."/>}
      </section>
      <section className="card"><div className="cardHead"><h2>Quick Actions</h2></div><div className="quickGrid">
        <Quick label="Add Subscription" icon="users" onClick={()=>onNavigate('subscriptions')}/><Quick label="Add Income" icon="income" onClick={()=>onNavigate('incomes')}/><Quick label="Add Expense" icon="expense" onClick={()=>onNavigate('expenses')}/><Quick label="Backup / Export" icon="download" onClick={()=>onNavigate('settings')}/>
      </div></section>
    </div>
  </div>;
}

function Stat({title,value,tone,sub}) { return <div className={`stat ${tone}`}><small>{title}</small><strong>{money(value)}</strong>{sub&&<em>{sub}</em>}</div>; }
function Quick({label,icon,onClick}) { return <button className="quick" onClick={onClick}><span><Icon name={icon}/></span>{label}</button>; }
function Empty({text}) { return <div className="empty">{text}</div>; }

function RecordPage({title,type,rows,query,setQuery,onAdd,onEdit,onDelete,onExport}) {
  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
  const total = rows.reduce((a,x)=>a+Number(x.amount),0);
  return <div className="page">
    <div className="pageHead"><div><h1>{title}</h1><p>{rows.length} record{rows.length!==1?'s':''} • Total {money(total)}</p></div><button className="primary" onClick={onAdd}><Icon name="plus"/> Add {type}</button></div>
    <div className="toolbar"><div className="search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search records..."/></div><button className="secondary" onClick={onExport}><Icon name="download"/> CSV</button></div>
    <section className="card tableCard"><div className="tableWrap"><table><thead><tr><th>Date</th><th>{type==='subscription'?'Name':type==='income'?'Source':'Payee'}</th>{type==='subscription'&&<th>Flat</th>}<th>{type==='subscription'?'Type':'Category'}</th><th>Amount</th>{type!=='expense'&&<th>Status</th>}<th>Mode</th><th>Action</th></tr></thead><tbody>
      {filtered.map(r=><tr key={r.id}><td>{dateFmt(r.date)}</td><td><b>{r.name||r.source||r.payee}</b><small>{r.remarks}</small></td>{type==='subscription'&&<td>{r.flatNo}</td>}<td>{r.type||r.category}</td><td className="amount">{money(r.amount)}</td>{type!=='expense'&&<td><span className={`badge ${r.status==='Received'?'received':'pending'}`}>{r.status}</span></td>}<td>{r.mode}</td><td><div className="actions"><button onClick={()=>onEdit(r)} title="Edit"><Icon name="edit"/></button><button className="dangerIcon" onClick={()=>onDelete(r)} title="Delete"><Icon name="trash"/></button></div></td></tr>)}
    </tbody></table></div>{!filtered.length&&<Empty text="No matching records."/>}</section>
  </div>;
}

function EntryModal({type,initial,existing,onClose,onSave}) {
  const isSub=type==='subscription', isInc=type==='income';
  const [form,setForm]=useState(()=>initial ? {...initial, name: initial.name||initial.source||initial.payee} : {date:today(),name:'',flatNo:'',amount:'',type:isSub?OPTIONS.subType[0]:isInc?OPTIONS.incomeCategory[0]:OPTIONS.expenseCategory[0],status:isSub||isInc?'Received':'Paid',mode:'Cash',remarks:''});
  const collection=isSub?'subscriptions':isInc?'incomes':'expenses';
  const duplicate=!initial && form.name && existing[collection].some(x=>x.name?.trim().toUpperCase()===form.name.trim().toUpperCase() && (!isSub || x.flatNo?.trim().toUpperCase()===form.flatNo.trim().toUpperCase()));
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=e=>{e.preventDefault(); if(!form.name.trim()) return; onSave(type,form);};
  return <div className="overlay"><div className="modal"><div className="modalHead"><h2>{initial?'Edit':'Add'} {type}</h2><button onClick={onClose}><Icon name="close"/></button></div><form onSubmit={submit}>
    <label>Date<input type="date" required value={form.date} onChange={e=>set('date',e.target.value)}/></label>
    <label>{isSub?'Name':isInc?'Source Name':'Payee Name'}<input required value={form.name} onChange={e=>set('name',e.target.value.toUpperCase())}/></label>
    {isSub&&<label>Flat No.<input required value={form.flatNo} onChange={e=>set('flatNo',e.target.value.toUpperCase())}/></label>}
    {duplicate&&<div className="warning">Warning: a similar entry already exists.</div>}
    <label>Amount (₹)<input type="number" min="0" step="0.01" required value={form.amount} onChange={e=>set('amount',e.target.value)}/></label>
    <label>{isSub?'Type':'Category'}<select value={form.type} onChange={e=>set('type',e.target.value)}>{(isSub?OPTIONS.subType:isInc?OPTIONS.incomeCategory:OPTIONS.expenseCategory).map(x=><option key={x}>{x}</option>)}</select></label>
    {(isSub||isInc)&&<label>Status<div className="radioRow">{OPTIONS.subStatus.map(x=><label className="radio" key={x}><input type="radio" checked={form.status===x} onChange={()=>set('status',x)}/>{x}</label>)}</div></label>}
    <label>Payment Mode<select value={form.mode} onChange={e=>set('mode',e.target.value)}>{OPTIONS.paymentMode.map(x=><option key={x}>{x}</option>)}</select></label>
    <label>Remarks / Ref No.<input value={form.remarks} onChange={e=>set('remarks',e.target.value.toUpperCase())}/></label>
    <button className="primary full" type="submit">Save {type}</button>
  </form></div></div>;
}

function Settings({onExport,onReset}) { return <div className="page"><div className="pageHead"><div><h1>Data & Backup</h1><p>Your records are stored locally on this device.</p></div></div><section className="card settings"><div className="settingRow"><div><b>Export all records</b><small>Download subscriptions, income and expenses as one CSV file.</small></div><button className="secondary" onClick={onExport}><Icon name="download"/> Export CSV</button></div><div className="settingRow"><div><b>Print report</b><small>Use your browser/device print dialog to save a PDF or print.</small></div><button className="secondary" onClick={()=>window.print()}><Icon name="print"/> Print</button></div><div className="settingRow danger"><div><b>Delete all local data</b><small>This cannot be undone.</small></div><button className="dangerBtn" onClick={onReset}>Clear data</button></div></section></div>; }

createRoot(document.getElementById('root')).render(<App/>);
