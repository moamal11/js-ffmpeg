<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أداة تحويل الفيديو</title>
    <!-- ضروري لتمكين SharedArrayBuffer -->
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
    <meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .warning {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #ffeeba;
        }
    </style>
</head>
<body>
    <h1>أداة تحويل الفيديو</h1>
    
    <div id="warning" class="warning">
        <h3>ملاحظة هامة:</h3>
        <p>هذه الأداة تتطلب تشغيلها في بيئة آمنة. الرجاء التأكد من:</p>
        <ul>
            <li>تشغيل الصفحة على خادم محلي (مثل localhost)</li>
            <li>أو تشغيلها عبر HTTPS مع رؤوس الأمان الصحيحة</li>
        </ul>
    </div>

    <div id="app-content" style="display: none;">
        <input type="file" id="file-input" accept="video/*" />
        <button id="convert-button">تحويل الفيديو</button>
        <div id="status"></div>
        <video id="output-video" controls style="display: none; width: 100%;"></video>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"></script>
    <script>
        // التحقق من دعم SharedArrayBuffer
        function checkCompatibility() {
            if (typeof SharedArrayBuffer === 'undefined') {
                document.getElementById('warning').innerHTML += `
                    <p style="color: red;">
                        <strong>خطأ:</strong> المتصفح لا يدعم SharedArrayBuffer أو رؤوس الأمان غير مضبوطة.
                        الرجاء استخدام Chrome/Firefox مع تشغيل الصفحة على خادم محلي.
                    </p>
                `;
                return false;
            }
            return true;
        }

        async function initializeApp() {
            if (!checkCompatibility()) return;

            try {
                document.getElementById('status').textContent = 'جارٍ التهيئة...';
                
                // استخدام إصدار بديل لا يحتاج لـ SharedArrayBuffer
                const { createFFmpeg, fetchFile } = FFmpeg;
                const ffmpeg = createFFmpeg({
                    log: true,
                    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'
                });

                document.getElementById('status').textContent = 'جارٍ تحميل FFmpeg...';
                await ffmpeg.load();
                
                document.getElementById('warning').style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
                document.getElementById('status').textContent = 'جاهز للتحويل';

                document.getElementById('convert-button').addEventListener('click', async () => {
                    const fileInput = document.getElementById('file-input');
                    const file = fileInput.files[0];
                    
                    if (!file) {
                        alert('الرجاء اختيار ملف فيديو أولاً');
                        return;
                    }

                    try {
                        document.getElementById('convert-button').disabled = true;
                        document.getElementById('status').textContent = 'جارٍ معالجة الفيديو...';

                        ffmpeg.FS('writeFile', file.name, await fetchFile(file));
                        
                        // استخدام إعدادات متوافقة
                        await ffmpeg.run(
                            '-i', file.name,
                            '-c:v', 'libx264',
                            '-preset', 'superfast',
                            '-crf', '23',
                            '-movflags', 'frag_keyframe+empty_moov',
                            'output.mp4'
                        );

                        const data = ffmpeg.FS('readFile', 'output.mp4');
                        const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
                        
                        const videoElement = document.getElementById('output-video');
                        videoElement.src = videoUrl;
                        videoElement.style.display = 'block';
                        document.getElementById('status').textContent = 'تم التحويل بنجاح!';
                    } catch (error) {
                        document.getElementById('status').textContent = `خطأ: ${error.message}`;
                        console.error(error);
                    } finally {
                        document.getElementById('convert-button').disabled = false;
                    }
                });

            } catch (error) {
                document.getElementById('status').textContent = `فشل التهيئة: ${error.message}`;
                console.error(error);
            }
        }

        // بدء التطبيق
        document.addEventListener('DOMContentLoaded', initializeApp);
    </script>
</body>
</html>
