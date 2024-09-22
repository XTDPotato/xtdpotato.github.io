//定义常驻变量
"use strict"; // 添加严格模式指令
let navigationDrawer = document.querySelector(".main-drawer"); // 使用 let 声明可变对象
let openDrawerButton = document.getElementById("fab_menu");
let closeDrawerButton = navigationDrawer.querySelector("mdui-button");
let main_tabs = document.getElementById("main_tabs");
let main_nv_home = document.getElementById("rail_item_home");
let main_nv_resources = document.getElementById("rail_item_resources");
let main_nv_notes = document.getElementById("rail_item_notes");
let main_nv_courses = document.getElementById("rail_item_courses");
let main_fab = document.getElementById("main_fab");
let add_note_dialog = document.querySelector(".add_note_dialog");
let add_note_dialog_cancel = document.getElementById("add_note_dialog_cancel");
let add_note_dialog_create = document.getElementById("add_note_dialog_create");
let add_note_ct_content = document.getElementById("add_note_dialog_ct_content");
let main_snackbar = document.querySelector(".snackbar_no_action");

let note_frame = document.getElementById("note_frame");
let notes_item_frame = document.getElementById("notes_item_frame");
let resources_item_frame = document.getElementById("resources_item_frame");
let main_fab_click_change = 0;



//浮动按钮初始化
main_fab.disabled = false;
main_fab.icon = "refresh--outlined"

  //浮动按钮添加的点击事件
  main_fab.addEventListener("click", () =>{
  if(main_fab_click_change==0){
  window.location.reload();
  
  }else if(main_fab_click_change==1){
  main_snackbar.textContent = "暂时不支持上传资源";
  main_snackbar.open = true;
  
  }else if(main_fab_click_change==2){
  add_note_dialog_ct_content.value = "";
  add_note_dialog.open = true;
  
  
  
  }else if(main_fab_click_change==3){
  main_snackbar.textContent = "暂时不支持添加教程";
  main_snackbar.open = true;
  
  
  }
  
  
  
  });
  
  
  //添加笔记对话框取消按钮点击事件
  add_note_dialog_cancel.addEventListener("click", () =>{
  add_note_dialog.open = false;
  
  
  });
  //添加笔记对话框创建按钮点击事件
  add_note_dialog_create.addEventListener("click", () =>{
  add_note_dialog.open = false;
  
  
  });
  
  
  
  
  //点击菜单的打开抽屉点击事件
  openDrawerButton.addEventListener("click", ()=>{
  navigationDrawer.open = true;

});

  //抽屉里面的关闭抽屉按钮点击事件
  closeDrawerButton.addEventListener("click", () =>{
  navigationDrawer.open = false;
  
  });
  
 //标签页主页点击事件
 main_nv_home.addEventListener("click", ()=>{
  main_tabs.value = "home";
  main_fab_click_change = 0;
  main_fab.disabled = false;
  main_fab.icon = "refresh--outlined";
  
});

  //标签页资源点击事件
 main_nv_resources.addEventListener("click", ()=>{
  main_tabs.value = "resources";
  main_fab_click_change = 1;
  main_fab.disabled = false;
  main_fab.icon = "upload--outlined";
  
  
});

  //标签页笔记点击事件
  main_nv_notes.addEventListener("click", ()=>{
  main_tabs.value = "notes";
  main_fab.disabled = false;
  main_fab_click_change = 2;
  main_fab.disabled = false;
  main_fab.icon = "add--outlined"
  
  
});

//标签页教程点击事件
  main_nv_courses.addEventListener("click", ()=>{
  main_tabs.value = "courses";
  main_fab.disabled = false;
  main_fab_click_change = 3;
  main_fab.disabled = false;
  main_fab.icon = "near_me--outlined"
  
  
});











 