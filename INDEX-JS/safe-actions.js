/* Explicit event bindings; no inline handler execution or dynamic code evaluation. */
window.bindSchedulerActions = function (scope) {
  scope.querySelectorAll('[data-nav], [data-action]').forEach(element => {
    if (element.dataset.actionBound) return;
    element.dataset.actionBound = 'true';
    element.addEventListener('click', event => {
      const action=element.dataset.action;
      if(action!=='campus') event.preventDefault();
      if(action==='reset') return SchedulerDemo.reset();
      if(action==='campus') return switchCampus(element);
      if(action==='delete') return deleteSchedule();
      if(element.dataset.nav) {
        const target=new URL(element.dataset.nav,location.href);
        if(target.origin===location.origin && ['http:','https:'].includes(target.protocol)) location.href=target.href;
      }
    });
  });
};
document.addEventListener('DOMContentLoaded',()=>window.bindSchedulerActions(document));
