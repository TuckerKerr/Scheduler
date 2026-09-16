// Search only fictional local data; values are rendered as text or allowlisted formatting.
document.addEventListener('DOMContentLoaded', function () {
  const input=document.getElementById('searchInput');
  const container=document.querySelector('.search-container');
  if(!input||!container)return;
  const results=document.createElement('div');
  results.className='search-results';container.appendChild(results);
  let timer, sequence=0;
  function textElement(tag,className,value){const el=document.createElement(tag);el.className=className;el.textContent=String(value??'');return el;}
  function description(parent,markup){
    const template=document.createElement('template');template.innerHTML=String(markup??'');
    function copy(node,target){
      if(node.nodeType===Node.TEXT_NODE){target.append(document.createTextNode(node.textContent));return;}
      if(node.nodeType!==Node.ELEMENT_NODE)return;
      if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','IMG','SVG','MATH','LINK','META'].includes(node.tagName))return;
      const next=['P','B','BR'].includes(node.tagName)?document.createElement(node.tagName.toLowerCase()):target;
      if(next!==target)target.append(next);
      for(const child of node.childNodes)copy(child,next);
    }
    for(const node of template.content.childNodes)copy(node,parent);
  }
  async function search(query){
    const current=++sequence;
    if(!query){results.classList.remove('active');return;}
    try{
      const response=await SchedulerDemo.request('../INDEX-PHP/search-assets.php?q='+encodeURIComponent(query));
      const data=await response.json();
      if(current!==sequence)return;
      if(!response.ok||!Array.isArray(data))throw Error('Search unavailable');
      results.replaceChildren();
      if(!data.length)results.append(textElement('div','search-no-results','No results found'));
      for(const item of data){
        const row=textElement('div','search-result-item','');
        row.append(textElement('div','search-result-title',item.asset));
        const details=textElement('div','search-result-details','');description(details,item.description);row.append(details);
        const footer=textElement('div','search-result-footer','');footer.append(textElement('span','search-result-tag',item.tag));
        if(item.date)footer.append(textElement('span','search-result-date',item.date));row.append(footer);
        row.addEventListener('click',()=>{
          input.value=String(item.asset??'');results.classList.remove('active');
          alert(String(item.asset??'')+'\n'+details.textContent+'\nFictional portfolio asset.');
        });
        results.append(row);
      }
      results.classList.add('active');
    }catch{results.classList.remove('active');}
  }
  input.addEventListener('input',()=>{clearTimeout(timer);sequence++;timer=setTimeout(()=>search(input.value.trim().slice(0,100)),300);});
  document.addEventListener('click',e=>{if(!container.contains(e.target))results.classList.remove('active');});
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'){results.classList.remove('active');return;}
    if(!results.classList.contains('active'))return;
    const rows=[...results.querySelectorAll('.search-result-item')];
    if(!rows.length)return;
    const current=rows.findIndex(row=>row.classList.contains('focused'));
    if(e.key==='Enter'&&current>=0){e.preventDefault();rows[current].click();return;}
    if(!['ArrowUp','ArrowDown'].includes(e.key))return;
    e.preventDefault();rows.forEach(row=>row.classList.remove('focused'));
    const next=(current+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length;
    rows[next].classList.add('focused');rows[next].scrollIntoView({block:'nearest'});
  });
});
