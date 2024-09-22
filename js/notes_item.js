//定义常驻变量
var main_snackbar = document.querySelector(".snackbar_no_action");
var note_copy_dialog = document.querySelector(".note_copy_dialog");
var close_btn = document.getElementById("close_btn");
var btn_notes = document.querySelectorAll(".btn_note")
var copy_btn = document.getElementById("copy_btn");

var note_frame = document.querySelector(".note_frame");
var copy_content = document.querySelector(".copy_content");
var note_loading_progress = document.getElementById("note_loading_progress");



//笔记点击事件
for (let btn_note of btn_notes) {
  btn_note.addEventListener("click", () => {
    note_copy_dialog.open = true;
    note_copy_dialog.headline = btn_note.textContent;

    let note_id = "notes/" + btn_note.id + ".html";
    note_frame.src = note_id;

    copy_content.style.display = "none";
    note_frame.style.display = "none";
    note_loading_progress.style.display = "block";


  
  
})};



window.addEventListener('message', function(event) {
    var note_frame = document.getElementById("note_frame");
    // 确保消息来自预期的 iframe
    if (event.source !== note_frame.contentWindow) return;

    // 确保消息是你期望的类型
    if (event.data.type === 'noteTC') {
        // 更新父页面中的文本
        copy_content.value = event.data.text;
		
		//更新
		copy_content.style.display = "block";
        note_frame.style.display = "block";
        note_loading_progress.style.display = "none";
		note_frame.style.display = "none"
		
		
        //console.log(event.data.text);
    }
}, false);





//复制按钮
copy_btn.addEventListener("click", ()=>{
  copyStr();

});
//关闭按钮
close_btn.addEventListener("click", ()=>{
  note_copy_dialog.open = false;

});




// 定义一个复制函数
async function copyStr() {
// 使用异步函数
// 获取textarea元素
  var textarea = document.getElementById("copy_content");
  var frame = document.getElementById("note_frame")
  
  // 选中textarea中的文本
  textarea.select();
  document.execCommand("copy");


}
