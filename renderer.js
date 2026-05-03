window.onerror = function(message, source, lineno, colno, error) {
  const errStr = `Error: ${message} at ${source}:${lineno}:${colno}`;
  if (window.api && window.api.logFromRenderer) {
    window.api.logFromRenderer(errStr);
  }
  alert(errStr);
};

window.onunhandledrejection = function(event) {
  const errStr = `Unhandled Rejection: ${event.reason}`;
  if (window.api && window.api.logFromRenderer) {
    window.api.logFromRenderer(errStr);
  }
  alert(errStr);
};

let file1 = null;
let file2 = null;

const dropzone1 = document.getElementById('dropzone-1');
const dropzone2 = document.getElementById('dropzone-2');

const content1 = document.getElementById('dropzone-content-1');
const content2 = document.getElementById('dropzone-content-2');

const details1 = document.getElementById('file-details-1');
const details2 = document.getElementById('file-details-2');

const name1 = document.getElementById('file-name-1');
const name2 = document.getElementById('file-name-2');

const path1 = document.getElementById('file-path-1');
const path2 = document.getElementById('file-path-2');

const btnCompare = document.getElementById('btn-compare');

const exePathInput = document.getElementById('exe-path');
const btnBrowseExe = document.getElementById('btn-browse-exe');
const mediainfoPathInput = document.getElementById('mediainfo-path');
const btnBrowseMediainfo = document.getElementById('btn-browse-mediainfo');

const settingsPanel = document.getElementById('settings-panel');
const btnToggleSettings = document.getElementById('btn-toggle-settings');

const dotVidcompare = document.getElementById('dot-vidcompare');
const dotMediainfo = document.getElementById('dot-mediainfo');

const cmdPatternInput = document.getElementById('cmd-pattern');
const cmdEditedLabel = document.getElementById('cmd-edited-label');
const btnResetCmd = document.getElementById('btn-reset-cmd');
const cmdPreview = document.getElementById('cmd-preview');

// Metadata elements
const metaVideo1 = document.getElementById('meta-video-1');
const metaVideo2 = document.getElementById('meta-video-2');
const metaAudio1 = document.getElementById('meta-audio-1');
const metaAudio2 = document.getElementById('meta-audio-2');
const metaExtra1 = document.getElementById('meta-extra-1');
const metaExtra2 = document.getElementById('meta-extra-2');
const metaSum1 = document.getElementById('meta-sum-1');
const metaSum2 = document.getElementById('meta-sum-2');

async function verifyAndToggleStatusDots() {
  const isVidcompareValid = await window.api.verifyPath(exePathInput.value.trim(), 'vidcompare');
  const groupVidcompare = document.getElementById('group-vidcompare');
  if (isVidcompareValid) {
    dotVidcompare.className = 'status-dot green';
    if (groupVidcompare) groupVidcompare.classList.add('hidden');
  } else {
    dotVidcompare.className = 'status-dot red';
    if (groupVidcompare) groupVidcompare.classList.remove('hidden');
  }

  const isMediainfoValid = await window.api.verifyPath(mediainfoPathInput.value.trim(), 'mediainfo');
  const groupMediainfo = document.getElementById('group-mediainfo');
  if (isMediainfoValid) {
    dotMediainfo.className = 'status-dot green';
    if (groupMediainfo) groupMediainfo.classList.add('hidden');
  } else {
    dotMediainfo.className = 'status-dot red';
    if (groupMediainfo) groupMediainfo.classList.remove('hidden');
  }
}

function updateCmdPreview() {
  const defaultPattern = 'video-compare.exe "{file1}" "{file2}"';
  let val = cmdPatternInput.value.trim() || defaultPattern;
  const exePath = exePathInput.value.trim();

  const f1 = file1 ? `"${file1.name}"` : '"<video 1>"';
  const f2 = file2 ? `"${file2.name}"` : '"<video 2>"';

  // Clear old duplicate matching quotes and normalize to single matching pair
  let cleanPattern = val
    .replace('"{exe}"', '{exe}').replace("'{exe}'", '{exe}')
    .replace('"{file1}"', '{file1}').replace("'{file1}'", '{file1}')
    .replace('"{file2}"', '{file2}').replace("'{file2}'", '{file2}')
    .replace('video-compare.exe', '{exe}');

  const previewStr = cleanPattern
    .replace('{exe}', `"${exePath || 'video-compare.exe'}"`)
    .replace('{file1}', f1)
    .replace('{file2}', f2);

  cmdPreview.value = previewStr;
}

// Initialization & LocalStorage Persistence for both Executable Paths
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('version-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.api.openChangelog();
  });

  document.querySelectorAll('.download-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.api.openExternal(link.href);
    });
  });

  document.getElementById('btn-copy-cmd').addEventListener('click', () => {
    navigator.clipboard.writeText(cmdPreview.value);
  });

  const storedExePath = localStorage.getItem('videoComparePath');
  if (storedExePath) {
    exePathInput.value = storedExePath;
  } else {
    const foundExePath = await window.api.checkExePath();
    if (foundExePath) {
      exePathInput.value = foundExePath;
      localStorage.setItem('videoComparePath', foundExePath);
    }
  }

  const storedMediainfoPath = localStorage.getItem('mediainfoPath');
  if (storedMediainfoPath) {
    mediainfoPathInput.value = storedMediainfoPath;
  } else {
    let foundMediainfoPath = null;
    if (exePathInput.value) {
      const folder = exePathInput.value.split(/[/\\]/).slice(0, -1).join('/');
      const testPath = folder + (window.api.platform === 'win32' ? '/MediaInfo.exe' : '/mediainfo');
      foundMediainfoPath = testPath;
    }
    if (foundMediainfoPath) {
      mediainfoPathInput.value = foundMediainfoPath;
      localStorage.setItem('mediainfoPath', foundMediainfoPath);
    }
  }

  const defaultPattern = 'video-compare.exe "{file1}" "{file2}"';
  const storedPattern = localStorage.getItem('customCmdPattern');
  if (storedPattern && storedPattern !== defaultPattern) {
    cmdPatternInput.value = storedPattern;
    cmdEditedLabel.classList.remove('hidden');
    btnResetCmd.classList.remove('hidden');
  } else {
    cmdPatternInput.value = defaultPattern;
    cmdEditedLabel.classList.add('hidden');
    btnResetCmd.classList.add('hidden');
  }

  await verifyAndToggleStatusDots();
  updateCmdPreview();
});

btnToggleSettings.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

document.getElementById('status-vidcompare').addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  const group = document.getElementById('group-vidcompare');
  if (group) group.classList.remove('hidden');
});
document.getElementById('status-mediainfo').addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  const group = document.getElementById('group-mediainfo');
  if (group) group.classList.remove('hidden');
});

exePathInput.addEventListener('input', async () => {
  localStorage.setItem('videoComparePath', exePathInput.value.trim());
  await verifyAndToggleStatusDots();
  updateCmdPreview();
});

mediainfoPathInput.addEventListener('input', async () => {
  localStorage.setItem('mediainfoPath', mediainfoPathInput.value.trim());
  await verifyAndToggleStatusDots();
});

btnBrowseExe.addEventListener('click', async () => {
  const filePath = await window.api.selectExe();
  if (filePath) {
    exePathInput.value = filePath;
    localStorage.setItem('videoComparePath', filePath);
    await verifyAndToggleStatusDots();
    updateCmdPreview();
  }
});

btnBrowseMediainfo.addEventListener('click', async () => {
  const filePath = await window.api.selectExe();
  if (filePath) {
    mediainfoPathInput.value = filePath;
    localStorage.setItem('mediainfoPath', filePath);
    await verifyAndToggleStatusDots();
  }
});

cmdPatternInput.addEventListener('input', () => {
  const defaultPattern = 'video-compare.exe "{file1}" "{file2}"';
  const val = cmdPatternInput.value.trim();
  localStorage.setItem('customCmdPattern', val);
  if (val !== defaultPattern) {
    cmdEditedLabel.classList.remove('hidden');
    btnResetCmd.classList.remove('hidden');
  } else {
    cmdEditedLabel.classList.add('hidden');
    btnResetCmd.classList.add('hidden');
  }
  updateCmdPreview();
});

btnResetCmd.addEventListener('click', () => {
  const defaultPattern = 'video-compare.exe "{file1}" "{file2}"';
  cmdPatternInput.value = defaultPattern;
  localStorage.setItem('customCmdPattern', defaultPattern);
  cmdEditedLabel.classList.add('hidden');
  btnResetCmd.classList.add('hidden');
  updateCmdPreview();
});

function formatDuration(seconds, fpsStr) {
  if (!seconds || isNaN(seconds)) return 'N/A';
  const fullSeconds = Math.floor(seconds);
  const fractionalSeconds = seconds - fullSeconds;

  let fps = 25;
  if (fpsStr) {
    const cleanFps = fpsStr.replace(/[^0-9./]/g, '');
    const parts = cleanFps.split('/');
    if (parts.length === 2 && parseFloat(parts[1]) > 0) {
      fps = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else if (!isNaN(parseFloat(cleanFps))) {
      fps = parseFloat(cleanFps);
    }
  }

  const h = Math.floor(fullSeconds / 3600);
  const m = Math.floor((fullSeconds % 3600) / 60);
  const s = fullSeconds % 60;
  const ff = Math.round(fractionalSeconds * fps);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ff.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return '0 MB';
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function parseMetadata(metadata, isDeep = false) {
  if (!metadata || !metadata.media || !metadata.media.track) {
    return { video: 'No data', audio: 'No data', extra: 'None', fileSize: '0 MB', sumText: '', deepScanNeeded: false };
  }
  
  const tracks = metadata.media.track;
  const general = tracks.find(t => t['@type'] === 'General') || {};
  const totalDuration = parseFloat(general.Duration || 0);
  const totalFileSize = parseInt(general.FileSize || 0);
  
  const videoTracks = tracks.filter(t => t['@type'] === 'Video');
  const audioTracks = tracks.filter(t => t['@type'] === 'Audio');
  const subTracks = tracks.filter(t => t['@type'] === 'Text');
  
  let videoText = 'None';
  let calculatedSum = 0;
  let deepScanNeeded = false;
  
  const spinnerHtml = `<span class="spinner" title="MediaInfo did not find stream size. Reading entire file in background..."></span>`;

  function getPct(size) {
    if (!totalFileSize || !size) return '';
    const pct = (size / totalFileSize) * 100;
    return ` (${pct.toFixed(1)}%)`;
  }

  if (videoTracks.length > 0) {
    let videoSizes = 0;
    const details = videoTracks.map(t => {
      const dur = parseFloat(t.Duration || totalDuration);
      const br = parseInt(t.BitRate || 0);
      const size = parseInt(t.StreamSize || 0) || (br > 0 ? (br * dur) / 8 : 0);
      videoSizes += size;
      
      const depth = t.BitDepth ? `${t.BitDepth}-bit` : '8-bit';
      const fpsStr = t.FrameRate || '25';
      
      let hdr = '';
      const keys = Object.keys(t);
      const hdrCompKey = keys.find(k => k.toLowerCase() === 'hdr_format_compatibility');
      const commercialHdrKey = keys.find(k => k.toLowerCase() === 'hdr_format_commercial');
      const normalHdrKey = keys.find(k => k.toLowerCase() === 'hdr_format');
      const genericHdrKey = keys.find(k => k.toLowerCase() === 'hdr');
      
      const primaryHdr = hdrCompKey || commercialHdrKey || normalHdrKey || genericHdrKey;
      if (primaryHdr && typeof t[primaryHdr] === 'string' && t[primaryHdr].length > 0) {
        hdr = `, ${t[primaryHdr].split('/')[0].trim()}`;
      }
      
      const brText = br > 0 ? `, ${formatNumber(Math.round(br / 1000))} kbps` : '';
      const infoStr = `${(t.Format || 'Unknown').toUpperCase()}, ${formatDuration(dur, fpsStr)}, ${depth}, ${t.Width}x${t.Height}${hdr}${brText}, ${fpsStr} fps`;
      
      let sizeStr = '';
      if (t.StreamSize_String) {
        sizeStr = t.StreamSize_String;
      } else if (size > 0) {
        sizeStr = formatSize(size) + getPct(size);
      } else if (!isDeep) {
        sizeStr = spinnerHtml;
        deepScanNeeded = true;
      } else {
        sizeStr = '0 MB';
      }
      
      return `<div class="meta-row"><span class="meta-left">${infoStr}</span><span class="meta-right">${sizeStr}</span></div>`;
    });
    
    calculatedSum += videoSizes;
    videoText = details.join('');
  }
  
  let audioText = 'None';
  if (audioTracks.length > 0) {
    let audioSizes = 0;
    const details = audioTracks.map((t, i) => {
      const dur = parseFloat(t.Duration || totalDuration);
      let br = parseInt(t.BitRate || 0);
      const size = parseInt(t.StreamSize || 0) || (br > 0 ? (br * dur) / 8 : 0);
      audioSizes += size;
      
      if (br === 0 && size > 0 && dur > 0) {
        br = Math.round((size * 8) / dur);
      }
      
      const brText = br > 0 ? `${formatNumber(Math.round(br / 1000))} kbit/s` : 'N/A';
      const format = t.Format_Commercial_IfAny || t.Format || 'Unknown';
      const channels = t.Channels ? `, ${t.Channels}ch` : '';
      const lang = t.Language ? `, ${t.Language.toUpperCase()}` : '';
      const infoStr = `Track ${i + 1}: ${format}, ${formatDuration(dur)}${channels}${lang}, ${brText}`;
      
      let sizeStr = '';
      if (t.StreamSize_String) {
        sizeStr = t.StreamSize_String;
      } else if (size > 0) {
        sizeStr = formatSize(size) + getPct(size);
      } else if (!isDeep) {
        sizeStr = spinnerHtml;
        deepScanNeeded = true;
      } else {
        sizeStr = '0 MB';
      }
      
      return `<div class="meta-row"><span class="meta-left">${infoStr}</span><span class="meta-right">${sizeStr}</span></div>`;
    });
    
    calculatedSum += audioSizes;
    audioText = details.join('');
  }
  
  let extraText = '';
  let miscSizes = 0;
  
  if (subTracks.length > 0) {
    const languages = subTracks.map(t => {
      return t.Language || t.language || 'Unknown';
    });
    const infoStr = `Subtitles: ${subTracks.length} track(s) [${languages.join(', ')}]`;
    extraText += `<div class="meta-row"><span class="meta-left">${infoStr}</span><span class="meta-right">&lt; 1 MB</span></div>`;
    miscSizes += subTracks.length * 50000; // Approx 50kb per sub track
  }

  const menuTrack = tracks.find(t => t['@type'] === 'Menu');
  if (menuTrack && menuTrack.extra) {
    const chapterCount = Object.keys(menuTrack.extra).length;
    if (chapterCount > 0) {
      const infoStr = `Chapters: ${chapterCount}`;
      extraText += `<div class="meta-row"><span class="meta-left">${infoStr}</span><span class="meta-right">N/A</span></div>`;
    }
  }

  const otherTracks = tracks.filter(t => t['@type'] !== 'General' && t['@type'] !== 'Video' && t['@type'] !== 'Audio' && t['@type'] !== 'Text' && t['@type'] !== 'Menu');
  if (otherTracks.length > 0) {
    otherTracks.forEach(t => {
      const size = parseInt(t.StreamSize || 0);
      miscSizes += size;
      const infoStr = `${t['@type'] || 'Other'} tracks (${t.Format || 'Unknown'})`;
      extraText += `<div class="meta-row"><span class="meta-left">${infoStr}</span><span class="meta-right">${formatSize(size)}${getPct(size)}</span></div>`;
    });
  }
  
  calculatedSum += miscSizes;

  if (extraText === '') {
    extraText = '<div class="meta-row"><span class="meta-left">None</span><span class="meta-right">0 MB</span></div>';
  }

  let sumText = '';
  if (deepScanNeeded) {
    sumText = `SUM: <span class="spinner" title="Waiting for deep scan to calculate total size..."></span> (Actual: ${formatSize(totalFileSize)})`;
  } else {
    sumText = `SUM: ${formatSize(calculatedSum)} (Actual: ${formatSize(totalFileSize)})`;
  }
  
  return {
    video: videoText,
    audio: audioText,
    extra: extraText,
    fileSize: formatSize(totalFileSize),
    sumText: sumText,
    deepScanNeeded: deepScanNeeded
  };
}

async function loadMetadata(file, metaVideo, metaAudio, metaExtra, fileSizeElement, metaSum) {
  metaVideo.textContent = 'Loading...';
  metaAudio.textContent = 'Loading...';
  metaExtra.textContent = 'Loading...';
  metaSum.textContent = '';
  
  const mediainfoPath = mediainfoPathInput.value.trim();
  const metadata = await window.api.getMediainfo(file.path, mediainfoPath);
  
  const info = parseMetadata(metadata, false);
  metaVideo.innerHTML = info.video;
  metaAudio.innerHTML = info.audio;
  metaExtra.innerHTML = info.extra;
  fileSizeElement.textContent = info.fileSize;
  metaSum.innerHTML = info.sumText;
  
  if (info.deepScanNeeded) {
    window.api.getMediainfo(file.path, mediainfoPath, true).then(deepMetadata => {
      const deepInfo = parseMetadata(deepMetadata, true);
      metaVideo.innerHTML = deepInfo.video;
      metaAudio.innerHTML = deepInfo.audio;
      metaExtra.innerHTML = deepInfo.extra;
      metaSum.innerHTML = deepInfo.sumText;
    });
  }
}

// Global Drag/Drop intercept
['dragenter', 'dragover'].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest('#dropzone-1')) dropzone1.classList.add('dragging');
    if (e.target.closest('#dropzone-2')) dropzone2.classList.add('dragging');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone1.classList.remove('dragging');
    dropzone2.classList.remove('dragging');
  }, false);
});

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  if (files.length > 2) {
    alert('Refused: Please select a maximum of 2 files.');
    return;
  }

  const blacklist = ['exe', 'bat', 'cmd', 'com', 'msi', 'py', 'vbs', 'ps1', 'js', 'sh', 'bin', 'dll', 'sys', 'vbx'];
  const validFiles = files.filter(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    return !blacklist.includes(ext);
  });

  if (validFiles.length === 0) {
    alert('Refused: Executable and script files are not supported.');
    return;
  }

  if (validFiles.length === 2) {
    const p1 = window.api.getPathForFile(validFiles[0]) || validFiles[0].path;
    file1 = { path: p1, name: p1 ? p1.split(/[/\\]/).pop() : validFiles[0].name };
    loadMetadata(file1, metaVideo1, metaAudio1, metaExtra1, document.getElementById('file-size-1'), metaSum1);
    
    const p2 = window.api.getPathForFile(validFiles[1]) || validFiles[1].path;
    file2 = { path: p2, name: p2 ? p2.split(/[/\\]/).pop() : validFiles[1].name };
    loadMetadata(file2, metaVideo2, metaAudio2, metaExtra2, document.getElementById('file-size-2'), metaSum2);
    
    updateUI();
  } else if (validFiles.length === 1) {
    const p = window.api.getPathForFile(validFiles[0]) || validFiles[0].path;
    const fileObj = { path: p, name: p ? p.split(/[/\\]/).pop() : validFiles[0].name };
    
    const overDropzone2 = e.target.closest('#dropzone-2');
    if (overDropzone2) {
      file2 = fileObj;
      loadMetadata(file2, metaVideo2, metaAudio2, metaExtra2, document.getElementById('file-size-2'), metaSum2);
    } else {
      file1 = fileObj;
      loadMetadata(file1, metaVideo1, metaAudio1, metaExtra1, document.getElementById('file-size-1'), metaSum1);
    }
    updateUI();
  }
});

function setupDropzone(zone, index, onFileSelected) {
  zone.addEventListener('click', async () => {
    const filePath = await window.api.selectFile();
    if (filePath) {
      onFileSelected({
        path: filePath,
        name: filePath.split(/[/\\]/).pop()
      });
    }
  });
}

function updateUI() {
  if (file1) {
    content1.style.display = 'none';
    details1.classList.add('active');
    name1.textContent = file1.name;
    path1.textContent = file1.path;
  } else {
    content1.style.display = 'flex';
    details1.classList.remove('active');
  }

  if (file2) {
    content2.style.display = 'none';
    details2.classList.add('active');
    name2.textContent = file2.name;
    path2.textContent = file2.path;
  } else {
    content2.style.display = 'flex';
    details2.classList.remove('active');
  }

  if (file1 && file2) {
    btnCompare.classList.add('ready');
    btnCompare.scrollIntoView({ behavior: 'smooth' });
  } else {
    btnCompare.classList.remove('ready');
  }
  
  updateCmdPreview();
}

setupDropzone(dropzone1, 1, (file) => {
  file1 = file;
  updateUI();
  loadMetadata(file1, metaVideo1, metaAudio1, metaExtra1, document.getElementById('file-size-1'), metaSum1);
});

setupDropzone(dropzone2, 2, (file) => {
  file2 = file;
  updateUI();
  loadMetadata(file2, metaVideo2, metaAudio2, metaExtra2, document.getElementById('file-size-2'), metaSum2);
});

btnCompare.addEventListener('click', () => {
  const exePath = exePathInput.value.trim();
  let pattern = cmdPatternInput.value.trim() || 'video-compare.exe "{file1}" "{file2}"';
  
  if (file1 && file2) {
    let cleanPattern = pattern
      .replace('"{exe}"', '{exe}').replace("'{exe}'", '{exe}')
      .replace('"{file1}"', '{file1}').replace("'{file1}'", '{file1}')
      .replace('"{file2}"', '{file2}').replace("'{file2}'", '{file2}')
      .replace('video-compare.exe', '{exe}');

    let cmdStr = cleanPattern
      .replace('{exe}', `"${exePath || 'video-compare.exe'}"`)
      .replace('{file1}', `"${file1.path}"`)
      .replace('{file2}', `"${file2.path}"`);
      
    window.api.compareVideos(cmdStr);
  }
});
