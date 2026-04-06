javascript:(function(){
  var script=document.createElement('script');
  script.type='module';
  script.src='/src/lib/notification-manager.js';
  script.onload=function(){
    window.__nmInit&&window.__nmInit();
    window.__clawpanel_notify&&window.__clawpanel_notify({
      title:'🤖 测试通知',
      body:'这是一条来自终端触发的测试消息！'
    });
  };
  document.head.appendChild(script);
})();
