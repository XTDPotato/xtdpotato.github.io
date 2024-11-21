// 定义常驻变量
        var main_snackbar = document.querySelector(".snackbar_no_action");
        var note_copy_dialog = document.querySelector(".note_copy_dialog");
        var close_btn = document.getElementById("close_btn");
        var btn_notes = document.querySelectorAll(".btn_note");
        var copy_btn = document.getElementById("copy_btn");

        var note_frame = document.querySelector(".note_frame");
        var copy_content = document.querySelector(".copy_content");
        var note_loading_progress = document.getElementById("note_loading_progress");

        // 用于获取notes文件夹下所有html文件的函数（这里简单使用fetch来模拟读取本地文件，实际应用中可能因浏览器安全限制等需要服务器端配合）
        async function getNoteFiles() {
            const files = [];
            const response = await fetch('notes'); // 尝试获取notes文件夹信息（实际可能需要服务器支持，这里只是示意）
            const data = await response.text();
            const lines = data.split('\n');
            for (const line of lines) {
                if (line.endsWith('.html')) {
                    files.push(line.trim());
                }
            }
            return files;
        }

        // 提取单个文件中的标题和笔记内容部分的函数
        async function extractNoteInfo(fileName) {
            const response = await fetch('notes/' + fileName);
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const title = doc.querySelector('title').textContent;
            const noteText = doc.querySelector('p.id="note"').textContent;
            return {
                title: title,
                noteText: noteText,
                fileName: fileName.replace('.html', '')
            };
        }

        // 填充笔记列表的函数
        async function populateNoteList() {
            const noteFiles = await getNoteFiles();
            const mduiList = document.querySelector('mdui-list');
            for (const file of noteFiles) {
                const { title, noteText, fileName } = await extractNoteInfo(file);
                const listItem = document.createElement('mdui-list-item');
                listItem.className = "btn_note";
                listItem.id = fileName;
                listItem.textContent = title;
                listItem.setAttribute('description', noteText);
                mduiList.appendChild(listItem);
            }
        }

        // 笔记点击事件
        for (let btn_note of btn_notes) {
            btn_note.addEventListener("click", () => {
                note_copy_dialog.open = true;
                note_copy_dialog.headline = btn_note.textContent;

                let note_id = "notes/" + btn_note.id + ".html";
                note_frame.src = note_id;

                copy_content.style.display = "none";
                note_frame.style.display = "none";
                note_loading_progress.style.display = "block";
            });
        }

        window.addEventListener('message', function (event) {
            var note_frame = document.getElementById("note_frame");
            // 确保消息来自预期的iframe
            if (event.source!== note_frame.contentWindow) return;

            // 确保消息是你期望的类型
            if (event.data.type === 'noteTC') {
                // 更新父页面中的文本
                copy_content.value = event.data.text;

                // 更新显示状态
                copy_content.style.display = "block";
                note_frame.style.display = "block";
                note_loading_progress.style.display = "none";
                note_frame.style.display = "none";
            }
        }, false);

        // 复制按钮
        copy_btn.addEventListener("click", () => {
            copyStr();
        });
        // 关闭按钮
        close_btn.addEventListener("click", () => {
            note_copy_dialog.open = false;
        });

        // 定义一个复制函数
        async function copyStr() {
            // 使用异步函数
            // 获取textarea元素
            var textarea = document.getElementById("copy_content");
            var frame = document.getElementById("note_frame");

            // 选中textarea中的文本
            textarea.select();
            document.execCommand("copy");
        }

        // 页面加载完成后执行填充笔记列表的操作
        window.addEventListener('load', () => {
            populateNoteList();
        });