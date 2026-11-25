(()=>{
const STORE='uldms_prototype_v1';
const seed={tenants:[
{id:1,name:'Maria Santos',type:'Individual',contact:'0917-555-0101',email:'maria.santos@example.test',address:'Tanza, Cavite',status:'Active'},
{id:2,name:'Juan Dela Cruz',type:'Individual',contact:'0917-555-0102',email:'juan.dc@example.test',address:'Trece Martires, Cavite',status:'Active'},
{id:3,name:'Ana Reyes Trading',type:'Business',contact:'046-555-0103',email:'ana.reyes@example.test',address:'Tanza, Cavite',status:'Active'},
{id:4,name:'Pedro Lim',type:'Individual',contact:'0917-555-0104',email:'pedro.lim@example.test',address:'Naic, Cavite',status:'Active'},
{id:5,name:'Carla Mendoza',type:'Individual',contact:'0917-555-0105',email:'carla.mendoza@example.test',address:'Tanza, Cavite',status:'Active'}
],
units:[
{id:1,code:'U-101',location:'Ground Floor',area:25,rent:8500,status:'Occupied'},
{id:2,code:'U-102',location:'Ground Floor',area:30,rent:9500,status:'Vacant'},
{id:3,code:'U-103',location:'Ground Floor',area:20,rent:7500,status:'Occupied'},
{id:4,code:'U-201',location:'Second Floor',area:35,rent:11000,status:'Occupied'},
{id:5,code:'U-202',location:'Second Floor',area:28,rent:9000,status:'Vacant'},
{id:6,code:'U-203',location:'Second Floor',area:40,rent:12500,status:'Occupied'}
],
leases:[
{id:1,tenantId:1,unitId:1,start:'2025-01-01',end:'2026-12-31',rent:8500,dueDay:5,status:'Active'},
{id:2,tenantId:3,unitId:3,start:'2025-03-01',end:'2026-12-31',rent:7500,dueDay:10,status:'Active'},
{id:3,tenantId:2,unitId:4,start:'2025-02-01',end:'2026-12-31',rent:11000,dueDay:5,status:'Active'},
{id:4,tenantId:4,unitId:6,start:'2025-04-01',end:'2026-12-31',rent:12500,dueDay:15,status:'Active'}
],
billings:[
{id:1,leaseId:1,period:'2026-11',issued:'2026-11-01',due:'2026-11-05',rent:8500,adjustment:0,total:8500,balance:0,status:'Paid'},
{id:2,leaseId:2,period:'2026-11',issued:'2026-11-01',due:'2026-11-10',rent:7500,adjustment:0,total:7500,balance:7500,status:'Pending'},
{id:3,leaseId:3,period:'2026-11',issued:'2026-11-01',due:'2026-11-05',rent:11000,adjustment:0,total:11000,balance:5000,status:'Partially Paid'},
{id:4,leaseId:4,period:'2026-11',issued:'2026-11-01',due:'2026-11-15',rent:12500,adjustment:0,total:12500,balance:12500,status:'Pending'}
],
payments:[
{id:1,billingId:1,date:'2026-11-03',amount:8500,method:'Cash',reference:'SAMPLE-001',remarks:'Paid in full',recordedBy:'Admin'},
{id:2,billingId:3,date:'2026-11-04',amount:6000,method:'Bank deposit (sample)',reference:'SAMPLE-002',remarks:'Partial payment',recordedBy:'Admin'}
],
users:[
{id:1,name:'Administrator',username:'admin',role:'Administrator',status:'Active'},
{id:2,name:'Office Staff',username:'staff',role:'Office Staff',status:'Active'}
],
logs:[]
};

let db;
try{
  db=JSON.parse(localStorage.getItem(STORE))||JSON.parse(JSON.stringify(seed));
}catch(e){
  db=JSON.parse(JSON.stringify(seed));
}

let currentUser='Admin Staff';
let currentPage='dashboard';

function save(){
  localStorage.setItem(STORE,JSON.stringify(db));
}

function nextId(list){
  return Math.max(0,...list.map(x=>Number(x.id)||0))+1;
}

function money(value){
  return '₱'+Number(value||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function escapeHTML(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[char]));
}

function toast(message){
  const element=document.getElementById('toast');
  element.textContent=message;
  element.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>element.classList.remove('show'),2600);
}

function log(action,details=''){
  db.logs.unshift({
    id:nextId(db.logs),
    action,
    details,
    user:currentUser,
    date:new Date().toLocaleString('en-PH')
  });
}

function tenant(id){
  return db.tenants.find(x=>x.id===Number(id))?.name||'Unknown tenant';
}

function unit(id){
  return db.units.find(x=>x.id===Number(id))?.code||'Unknown unit';
}

function lease(id){
  return db.leases.find(x=>x.id===Number(id));
}

function leaseName(id){
  const item=lease(id);
  return item?tenant(item.tenantId)+' / '+unit(item.unitId):'Unknown lease';
}

function badge(status){
  let color='blue';
  if(['Active','Paid','Occupied'].includes(status))color='green';
  if(['Pending','Vacant','Draft'].includes(status))color='orange';
  if(['Expired','Inactive'].includes(status))color='red';
  return `<span class="badge ${color}">${escapeHTML(status)}</span>`;
}

function field(label,name,value='',type='text',required=true,extra=''){
  return `<div class="form-group">
    <label>${label}</label>
    <input name="${name}" type="${type}" value="${escapeHTML(value)}"
      ${required?'required':''} ${extra}>
  </div>`;
}

function selectField(label,name,options,value=''){
  return `<div class="form-group">
    <label>${label}</label>
    <select name="${name}" required>
      ${options.map(option=>`
        <option value="${escapeHTML(option.value)}"
          ${String(option.value)===String(value)?'selected':''}>
          ${escapeHTML(option.label)}
        </option>`).join('')}
    </select>
  </div>`;
}

function openModal(title,content,footer=''){
  document.getElementById('modalRoot').innerHTML=`
    <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
      <div class="modal">
        <div class="modal-head">
          <h2>${title}</h2>
          <button class="close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-content">${content}</div>
        <div class="modal-foot">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          ${footer}
        </div>
      </div>
    </div>`;
}

function closeModal(){
  document.getElementById('modalRoot').innerHTML='';
}

function pageHead(title,description,button=''){
  return `<div class="page-head">
    <div><h1>${title}</h1><p>${description}</p></div>
    ${button}
  </div>`;
}

function statCard(label,value,hint,color=''){
  return `<div class="stat ${color}">
    <div class="label">${label}</div>
    <div class="value">${value}</div>
    <div class="hint">${hint}</div>
  </div>`;
}

function table(headers,rows){
  return `<div class="table-wrap"><table>
    <thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead>
    <tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}" class="empty">No records found.</td></tr>`}</tbody>
  </table></div>`;
}

function render(){
  const view=document.getElementById('view');
  if(!view)return;

  const pages={
    dashboard:renderDashboard,
    tenants:renderTenants,
    units:renderUnits,
    leases:renderLeases,
    billing:renderBilling,
    reports:renderReports,
    users:renderUsers
  };

  view.innerHTML=(pages[currentPage]||renderDashboard)();

  document.querySelectorAll('#nav button[data-page]').forEach(button=>{
    button.classList.toggle('active',button.dataset.page===currentPage);
  });
}

function nav(page){
  currentPage=page;
  render();
}

function renderDashboard(){
  const occupied=db.units.filter(x=>x.status==='Occupied').length;
  const vacant=db.units.filter(x=>x.status==='Vacant').length;
  const outstanding=db.billings.reduce((sum,x)=>sum+x.balance,0);
  const collected=db.payments.reduce((sum,x)=>sum+x.amount,0);

  const recent=db.logs.slice(0,6).map(item=>`
    <tr>
      <td>${escapeHTML(item.date)}</td>
      <td>${escapeHTML(item.action)}</td>
      <td>${escapeHTML(item.details)}</td>
      <td>${escapeHTML(item.user)}</td>
    </tr>`);

  return `
    ${pageHead('Dashboard','Overview of unit leasing records and sample transactions.')}

    <div class="grid stats">
      ${statCard('Total Units',db.units.length,'Registered rental units')}
      ${statCard('Occupied Units',occupied,'Currently occupied','teal')}
      ${statCard('Vacant Units',vacant,'Available units','orange')}
      ${statCard('Active Tenants',db.tenants.filter(x=>x.status==='Active').length,'Registered tenants','green')}
    </div>

    <div class="grid stats">
      ${statCard('Total Billed',money(db.billings.reduce((sum,x)=>sum+x.total,0)),'Sample billing records')}
      ${statCard('Payments Received',money(collected),'Recorded sample payments','teal')}
      ${statCard('Outstanding Balance',money(outstanding),'Unpaid sample balance','orange')}
      ${statCard('Active Leases',db.leases.filter(x=>x.status==='Active').length,'Current lease records','green')}
    </div>

    <div class="grid two-col">
      <div class="panel">
        <div class="panel-head"><h3>Recent Activities</h3></div>
        <div class="panel-body">
          ${table(['Date','Activity','Details','User'],recent)}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Quick Actions</h3></div>
        <div class="panel-body">
          <div class="quick-actions">
            <button onclick="showTenantForm()">Add Tenant<span>Register a tenant</span></button>
            <button onclick="showUnitForm()">Add Unit<span>Register a rental unit</span></button>
            <button onclick="showLeaseForm()">Create Lease<span>Record a lease</span></button>
            <button onclick="showBillingForm()">Create Billing<span>Generate sample billing</span></button>
          </div>
        </div>
      </div>
    </div>`;
}
