var note_text = document.querySelector(".note_text");
var tx_note = note_text.textContent;
//console.log(tx_note);

// 发送消息到父页面
parent.postMessage({ type: 'noteTC', text: tx_note }, '*');
