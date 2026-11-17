"use strict";
/* 二进制输出：ZIP 打包（只存储不再压缩，图片和音频本身已经压过）与 WAV 编码 */
(function () {
  const CRC = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    CRC[n] = c >>> 0;
  }
  function crc32(u8) {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // files: [{ name, blob }]，返回 zip 的 Blob
  XTD.zip = async function (files) {
    const enc = new TextEncoder();
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [];
    const central = [];
    let offset = 0;

    for (const f of files) {
      const name = enc.encode(f.name);
      const data = new Uint8Array(await f.blob.arrayBuffer());
      const crc = crc32(data);

      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);        // 解压所需版本
      local.setUint16(6, 0x0800, true);    // 文件名为 UTF-8
      local.setUint16(8, 0, true);         // 存储，不压缩
      local.setUint16(10, time, true);
      local.setUint16(12, date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true);
      local.setUint32(22, data.length, true);
      local.setUint16(26, name.length, true);
      local.setUint16(28, 0, true);
      parts.push(local, name, data);

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true);
      cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true);
      cd.setUint16(12, time, true);
      cd.setUint16(14, date, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true);
      cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);      // 本地文件头的位置
      central.push(cd, name);

      offset += 30 + name.length + data.length;
      if (offset > 0xffffffff) throw new Error("打包后超过 4 GB，分几次下载。");
    }

    const cdSize = central.reduce((n, p) => n + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  };

  // 把 AudioBuffer 的 [from, to) 秒编码成 16 位 PCM WAV
  XTD.wav = function (buffer, from, to) {
    const rate = buffer.sampleRate;
    const ch = buffer.numberOfChannels;
    const a = Math.max(0, Math.floor(from * rate));
    const n = Math.max(0, Math.min(buffer.length, Math.floor(to * rate)) - a);
    const size = n * ch * 2;
    const view = new DataView(new ArrayBuffer(44 + size));
    const text = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    text(0, "RIFF");
    view.setUint32(4, 36 + size, true);
    text(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, ch, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * ch * 2, true);
    view.setUint16(32, ch * 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, size, true);
    for (let c = 0; c < ch; c++) {
      const d = buffer.getChannelData(c);
      for (let i = 0, o = 44 + c * 2; i < n; i++, o += ch * 2) {
        const v = d[a + i];
        view.setInt16(o, v <= -1 ? -32768 : v >= 1 ? 32767 : v < 0 ? v * 32768 : v * 32767, true);
      }
    }
    return new Blob([view.buffer], { type: "audio/wav" });
  };
})();
