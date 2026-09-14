const $ = (id) => document.getElementById(id);
const labels = {id:'申請番号',status:'ステータス',name:'氏名',kana:'フリガナ',birthDate:'生年月日',gender:'性別',email:'メールアドレス',phone:'電話番号',address:'住所',startDate:'入社予定日',department:'所属部署',job:'職種',employmentType:'雇用形態',notes:'備考',createdAt:'申請日時'};
let accessToken = '';
let today = '';
let loading = false;
function notify(message, failure=false) { $('notice').textContent=message; $('notice').hidden=false; $('notice').className=failure?'failure':''; }
function view(name) { for(const page of ['new','list','detail']) $(page+'-view').hidden=page!==name; $('new-tab').classList.toggle('active',name==='new'); $('list-tab').classList.toggle('active',name!=='new'); }
function dateTime(value) { return new Intl.DateTimeFormat('ja-JP',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tokyo'}).format(new Date(value)); }
async function api(path, options={}) {
  const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(accessToken?{Authorization:'Bearer '+accessToken}:{}),...options.headers}});
  const data=await res.json();
  if(!res.ok) { if(res.status===401) $('access').hidden=false; const error=new Error(data.message||'通信に失敗しました。'); error.fields=data.errors; throw error; }
  return data;
}
function clearErrors() { document.querySelectorAll('.error').forEach(el=>el.remove()); document.querySelectorAll('[aria-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby');}); }
function showErrors(errors) {
  for(const [key,message] of Object.entries(errors)) { const input=$(key); if(!input) continue; input.setAttribute('aria-invalid','true'); input.setAttribute('aria-describedby',key+'-error'); const el=document.createElement('small');el.id=key+'-error';el.className='error';el.textContent=message;input.parentElement.append(el); }
  document.querySelector('[aria-invalid]')?.focus();
}
async function list() {
  if(loading) return;
  loading=true; view('list'); $('refresh').disabled=true; $('rows').replaceChildren(); $('count').textContent='…'; $('empty').hidden=false; $('empty').textContent='読み込み中…';
  try {
    const items=await api('/api/applications'); $('count').textContent=items.length+'件'; $('empty').hidden=items.length>0; $('empty').textContent='まだ申請はありません。新規申請から登録してください。';
    for(const item of items) {
      const row=document.createElement('tr');
      for(const key of ['id','name','startDate','department','employmentType','createdAt','status']) {
        const cell=document.createElement('td');
        if(key==='name') { const button=document.createElement('button'); button.type='button';button.className='name-link';button.textContent=item.name;button.addEventListener('click',()=>detail(item.id));cell.append(button); }
        else if(key==='status') {const badge=document.createElement('span');badge.className='status';badge.textContent=item.status;cell.append(badge);}
        else cell.textContent=key==='createdAt'?dateTime(item[key]):item[key];
        row.append(cell);
      }
      $('rows').append(row);
    }
  } catch(error) { $('count').textContent='—';$('empty').textContent='一覧を取得できませんでした。「更新」で再試行してください。'; notify(error.message,true); }
  finally {loading=false;$('refresh').disabled=false;}
}
async function detail(id) {
  try { const item=await api('/api/applications/'+encodeURIComponent(id)); $('detail').replaceChildren();
    for(const [key,label] of Object.entries(labels)) { const block=document.createElement('div'); const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=key==='createdAt'?dateTime(item[key]):item[key]||'—';block.append(dt,dd);$('detail').append(block); }
    view('detail');
  } catch(error) {notify(error.message,true);}
}
$('application-form').addEventListener('submit',async (event)=>{
  event.preventDefault(); clearErrors(); $('notice').hidden=true;
  const data=Object.fromEntries(new FormData(event.target));const errors={};
  for(const field of event.target.querySelectorAll('[required]')) if(!data[field.name].trim()) errors[field.name]='必須項目です。';
  if(data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email='メールアドレスの形式を確認してください。';
  if(data.phone && (!/^\+?[0-9][0-9 -]*[0-9]$/.test(data.phone.trim()) || !/^\d{10,15}$/.test(data.phone.replace(/\D/g,'')))) errors.phone='電話番号は10〜15桁の数字で入力してください。';
  if(data.startDate && today && data.startDate<today) errors.startDate='入社予定日は今日以降（日本時間）にしてください。';
  if(data.birthDate && today && data.birthDate>=today) errors.birthDate='生年月日は今日より前の日付にしてください。';
  if(Object.keys(errors).length) {showErrors(errors);notify('入力内容を確認してください。',true);return;}
  $('submit').disabled=true;$('submit').textContent='申請中…';
  try {const item=await api('/api/applications',{method:'POST',body:JSON.stringify(data)});event.target.reset();notify('申請を受け付けました。申請番号：'+item.id);await detail(item.id);}
  catch(error){showErrors(error.fields||{});notify(error.message,true);}
  finally{$('submit').disabled=false;$('submit').textContent='申請する →';}
});
$('new-tab').addEventListener('click',()=>{view('new');$('notice').hidden=true;});
$('list-tab').addEventListener('click',()=>{$('notice').hidden=true;list();});
$('refresh').addEventListener('click',()=>{$('notice').hidden=true;list();});
$('back').addEventListener('click',list);
$('unlock').addEventListener('click',async()=>{accessToken=$('token').value.trim();try{await api('/api/applications');$('access').hidden=true;$('token').value='';notify('接続しました。');}catch(error){notify(error.message,true);}});
api('/api/config').then(config=>{today=config.today;$('startDate').min=today;$('environment').textContent=config.storage;$('access').hidden=!config.authRequired;}).catch(()=>{$('environment').textContent='接続エラー';notify('サーバーに接続できません。ページを再読み込みしてください。',true);});
